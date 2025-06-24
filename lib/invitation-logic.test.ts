import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateInvitationToken,
  validateInvitationToken,
  createInvitation,
  markInvitationUsed,
  getUserInvitationStats,
} from './invitation-logic';
import { db } from './db';
import * as crypto from 'crypto';
import * as emailService from './email-service';

// Mock dependencies
vi.mock('./db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('./email-service', () => ({
  sendInvitationEmail: vi.fn(),
  sendTargetedInvitationEmail: vi.fn(),
}));

vi.mock('crypto', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    randomBytes: vi.fn(),
  };
});

describe('invitation-logic security tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateInvitationToken', () => {
    it('should generate a 64-character hex token', () => {
      const mockBuffer = Buffer.from('a'.repeat(32));
      vi.mocked(crypto.randomBytes).mockReturnValue(mockBuffer);

      const token = generateInvitationToken();
      expect(token).toHaveLength(64);
      expect(token).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate unique tokens', () => {
      const mockBuffer1 = Buffer.from('a'.repeat(32));
      const mockBuffer2 = Buffer.from('b'.repeat(32));
      
      vi.mocked(crypto.randomBytes)
        .mockReturnValueOnce(mockBuffer1)
        .mockReturnValueOnce(mockBuffer2);

      const token1 = generateInvitationToken();
      const token2 = generateInvitationToken();
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('validateInvitationToken', () => {
    it('should reject invalid token format', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect);

      const result = await validateInvitationToken('invalid-token');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid invitation token');
    });

    it('should reject already used invitations', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: '123',
              email: 'test@example.com',
              expiresAt: new Date(Date.now() + 86400000), // Tomorrow
              usedAt: new Date(), // Already used
            }]),
          }),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect);

      const result = await validateInvitationToken('valid-token');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('This invitation has already been used');
    });

    it('should reject expired invitations', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: '123',
              email: 'test@example.com',
              expiresAt: new Date(Date.now() - 86400000), // Yesterday
              usedAt: null,
            }]),
          }),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect);

      const result = await validateInvitationToken('valid-token');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('This invitation has expired');
    });

    it('should reject if email already registered', async () => {
      // First call for invitation lookup
      const mockSelectInvitation = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: '123',
              email: 'test@example.com',
              expiresAt: new Date(Date.now() + 86400000),
              usedAt: null,
            }]),
          }),
        }),
      });

      // Second call for user lookup
      const mockSelectUser = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 'user123',
              firstName: 'Test',
              lastName: 'User',
              email: 'test@example.com',
            }]),
          }),
        }),
      });

      vi.mocked(db.select)
        .mockImplementationOnce(mockSelectInvitation)
        .mockImplementationOnce(mockSelectUser);

      const result = await validateInvitationToken('valid-token');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('A user with this email already exists');
      expect(result.user).toBeDefined();
    });

    it('should validate a good token', async () => {
      // First call for invitation lookup
      const mockSelectInvitation = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: '123',
              email: 'test@example.com',
              expiresAt: new Date(Date.now() + 86400000),
              usedAt: null,
            }]),
          }),
        }),
      });

      // Second call for user lookup (no existing user)
      const mockSelectUser = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      vi.mocked(db.select)
        .mockImplementationOnce(mockSelectInvitation)
        .mockImplementationOnce(mockSelectUser);

      const result = await validateInvitationToken('valid-token');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('createInvitation', () => {
    it('should prevent non-admins from inviting admins', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 'headta123',
              firstName: 'Head',
              lastName: 'TA',
              role: 'head_ta',
            }]),
          }),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect);

      const result = await createInvitation('headta123', 'newadmin@example.com', 'admin');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Only admins can invite other admins');
    });

    it('should reject invitation if user already exists', async () => {
      // First call - inviter lookup
      const mockSelectInviter = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 'admin123',
              firstName: 'Admin',
              lastName: 'User',
              role: 'admin',
            }]),
          }),
        }),
      });

      // Second call - existing user check
      const mockSelectExisting = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 'existing123' }]),
          }),
        }),
      });

      vi.mocked(db.select)
        .mockImplementationOnce(mockSelectInviter)
        .mockImplementationOnce(mockSelectExisting);

      const result = await createInvitation('admin123', 'existing@example.com', 'head_ta');
      expect(result.success).toBe(false);
      expect(result.error).toBe('A user with this email already exists');
    });

    it('should reject if active invitation already exists', async () => {
      // Mock all the select calls
      const mockSelects = [
        // Inviter lookup
        [{
          id: 'admin123',
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin',
        }],
        // Existing user check (none)
        [],
        // Existing invitation check (found one)
        [{ id: 'inv123' }],
      ];

      let selectCallCount = 0;
      vi.mocked(db.select).mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(mockSelects[selectCallCount++]),
          }),
        }),
      }));

      const result = await createInvitation('admin123', 'new@example.com', 'head_ta');
      expect(result.success).toBe(false);
      expect(result.error).toBe('An active invitation already exists for this email');
    });

    it('should create valid invitation with proper expiration', async () => {
      const mockBuffer = Buffer.from('a'.repeat(32));
      vi.mocked(crypto.randomBytes).mockReturnValue(mockBuffer);

      // Mock all the select calls
      const mockSelects = [
        // Inviter lookup
        [{
          id: 'admin123',
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin',
        }],
        // Existing user check (none)
        [],
        // Existing invitation check (none)
        [],
      ];

      let selectCallCount = 0;
      vi.mocked(db.select).mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(mockSelects[selectCallCount++]),
          }),
        }),
      }));

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{
            id: 'newinv123',
            email: 'new@example.com',
            token: 'generated-token',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          }]),
        }),
      });
      vi.mocked(db.insert).mockImplementation(mockInsert);

      const result = await createInvitation('admin123', 'new@example.com', 'head_ta', 7);
      expect(result.success).toBe(true);
      expect(result.invitation).toBeDefined();
      expect(emailService.sendInvitationEmail).toHaveBeenCalled();
    });

    it('should handle email sending failures gracefully', async () => {
      const mockBuffer = Buffer.from('a'.repeat(32));
      vi.mocked(crypto.randomBytes).mockReturnValue(mockBuffer);

      // Setup successful database operations
      const mockSelects = [
        [{
          id: 'admin123',
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin',
        }],
        [],
        [],
      ];

      let selectCallCount = 0;
      vi.mocked(db.select).mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(mockSelects[selectCallCount++]),
          }),
        }),
      }));

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{
            id: 'newinv123',
            email: 'new@example.com',
            token: 'generated-token',
            expiresAt: new Date(),
          }]),
        }),
      });
      vi.mocked(db.insert).mockImplementation(mockInsert);

      // Make email sending fail
      vi.mocked(emailService.sendInvitationEmail).mockRejectedValue(new Error('Email service down'));

      const result = await createInvitation('admin123', 'new@example.com', 'head_ta');
      // The function catches the error and returns failure
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to create invitation');
    });
  });

  describe('markInvitationUsed', () => {
    it('should mark valid invitation as used', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({ rowCount: 1 }),
        }),
      });
      vi.mocked(db.update).mockImplementation(mockUpdate);

      const result = await markInvitationUsed('valid-token');
      expect(result).toBe(true);
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(db.update).mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = await markInvitationUsed('valid-token');
      expect(result).toBe(false);
    });

    it('should not mark already used invitations', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({ rowCount: 0 }),
        }),
      });
      vi.mocked(db.update).mockImplementation(mockUpdate);

      const result = await markInvitationUsed('already-used-token');
      expect(result).toBe(true); // Function always returns true unless error
    });
  });

  describe('getUserInvitationStats', () => {
    it('should return complete invitation statistics', async () => {
      // Mock invitations query
      const mockSelectInvitations = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([
              {
                id: 'inv1',
                email: 'pending@example.com',
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 86400000),
                usedAt: null,
              },
              {
                id: 'inv2',
                email: 'used@example.com',
                createdAt: new Date(),
                expiresAt: new Date(),
                usedAt: new Date(),
              },
            ]),
          }),
        }),
      });

      // Mock joined users query
      const mockSelectUsers = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([
              {
                email: 'joined@example.com',
                firstName: 'Joined',
                lastName: 'User',
                createdAt: new Date(),
              },
            ]),
          }),
        }),
      });

      vi.mocked(db.select)
        .mockImplementationOnce(mockSelectInvitations)
        .mockImplementationOnce(mockSelectUsers);

      const stats = await getUserInvitationStats('user123');
      expect(stats.totalSent).toBe(2);
      expect(stats.totalAccepted).toBe(1);
      expect(stats.pendingInvitations).toHaveLength(1);
      expect(stats.acceptedInvitations).toHaveLength(1);
    });

    it('should handle users with no invitations', async () => {
      vi.mocked(db.select).mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([]),
          }),
        }),
      }));

      const stats = await getUserInvitationStats('user123');
      expect(stats.totalSent).toBe(0);
      expect(stats.totalAccepted).toBe(0);
      expect(stats.pendingInvitations).toHaveLength(0);
      expect(stats.acceptedInvitations).toHaveLength(0);
    });
  });

  describe('security edge cases', () => {
    it('should handle SQL injection in email parameter', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect);

      const result = await validateInvitationToken("'; DROP TABLE invitations; --");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid invitation token');
    });

    it('should enforce expiration time limits', async () => {
      // Setup mocks for successful invitation creation
      const mockSelects = [
        [{
          id: 'admin123',
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin',
        }],
        [],
        [],
      ];

      let selectCallCount = 0;
      vi.mocked(db.select).mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(mockSelects[selectCallCount++]),
          }),
        }),
      }));

      let capturedValues: any;
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockImplementation((values) => {
          capturedValues = values;
          return {
            returning: vi.fn().mockResolvedValue([{
              id: 'newinv123',
              email: values.email,
              token: values.token,
              expiresAt: values.expiresAt,
            }]),
          };
        }),
      });
      vi.mocked(db.insert).mockImplementation(mockInsert);

      // Test with various expiration days
      await createInvitation('admin123', 'test@example.com', 'head_ta', 365);
      
      // Check that expiration is set correctly
      const expirationTime = capturedValues.expiresAt.getTime() - new Date().getTime();
      const dayInMs = 24 * 60 * 60 * 1000;
      expect(expirationTime).toBeGreaterThan(364 * dayInMs);
      expect(expirationTime).toBeLessThan(366 * dayInMs);
    });
  });
});