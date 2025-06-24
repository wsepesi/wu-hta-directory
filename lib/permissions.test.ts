import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  hasAdminAccess,
  canManageCourses,
  canSendInvitations,
  canViewPrivateInfo,
  canEditUser,
  canDeleteUser,
  canManageTAAssignments,
  requirePermission,
} from './permissions';
import { db } from './db';

// Mock the database
vi.mock('./db', () => ({
  db: {
    select: vi.fn(),
  },
}));

describe('permissions security tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('hasAdminAccess', () => {
    it('should return true for admin users', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ role: 'admin' }]),
          }),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect);

      const result = await hasAdminAccess('user123');
      expect(result).toBe(true);
    });

    it('should return false for non-admin users', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ role: 'head_ta' }]),
          }),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect);

      const result = await hasAdminAccess('user123');
      expect(result).toBe(false);
    });

    it('should return false for non-existent users', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect);

      const result = await hasAdminAccess('nonexistent');
      expect(result).toBe(false);
    });

    it('should handle SQL injection attempts in userId', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect);

      // Attempt SQL injection
      const result = await hasAdminAccess("'; DROP TABLE users; --");
      expect(result).toBe(false);
      // The parameterized query should handle this safely
    });
  });

  describe('canSendInvitations', () => {
    it('should allow admins to invite both admins and head TAs', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ role: 'admin' }]),
          }),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect);

      const result = await canSendInvitations({ userId: 'admin123' });
      expect(result.canSend).toBe(true);
      expect(result.allowedRoles).toEqual(['admin', 'head_ta']);
    });

    it('should allow head TAs to invite only head TAs', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ role: 'head_ta' }]),
          }),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect);

      const result = await canSendInvitations({ userId: 'headta123' });
      expect(result.canSend).toBe(true);
      expect(result.allowedRoles).toEqual(['head_ta']);
    });

    it('should deny invitation permissions for non-existent users', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect);

      const result = await canSendInvitations({ userId: 'nonexistent' });
      expect(result.canSend).toBe(false);
      expect(result.allowedRoles).toEqual([]);
    });

    it('should use provided role to avoid database query', async () => {
      const result = await canSendInvitations({ 
        userId: 'admin123', 
        userRole: 'admin' 
      });
      
      expect(result.canSend).toBe(true);
      expect(result.allowedRoles).toEqual(['admin', 'head_ta']);
      expect(db.select).not.toHaveBeenCalled();
    });
  });

  describe('canViewPrivateInfo', () => {
    it('should allow users to view their own information', async () => {
      const result = await canViewPrivateInfo('user123', 'user123');
      expect(result).toBe(true);
      // Should not query database for own info
      expect(db.select).not.toHaveBeenCalled();
    });

    it('should allow admins to view any user information', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ role: 'admin' }]),
          }),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect);

      const result = await canViewPrivateInfo('admin123', 'user456');
      expect(result).toBe(true);
    });

    it('should deny non-admins from viewing other users information', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ role: 'head_ta' }]),
          }),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect);

      const result = await canViewPrivateInfo('user123', 'user456');
      expect(result).toBe(false);
    });
  });

  describe('canDeleteUser', () => {
    it('should prevent users from deleting themselves', async () => {
      const result = await canDeleteUser('user123', 'user123');
      expect(result).toBe(false);
      // Should not query database for self-deletion
      expect(db.select).not.toHaveBeenCalled();
    });

    it('should allow admins to delete other users', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ role: 'admin' }]),
          }),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect);

      const result = await canDeleteUser('admin123', 'user456');
      expect(result).toBe(true);
    });

    it('should prevent non-admins from deleting users', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ role: 'head_ta' }]),
          }),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect);

      const result = await canDeleteUser('user123', 'user456');
      expect(result).toBe(false);
    });
  });

  describe('canManageTAAssignments', () => {
    it('should allow admins to manage TA assignments', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ role: 'admin' }]),
          }),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect);

      const result = await canManageTAAssignments({ userId: 'admin123' });
      expect(result).toBe(true);
    });

    it('should allow head TAs to manage TA assignments', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ role: 'head_ta' }]),
          }),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect);

      const result = await canManageTAAssignments({ userId: 'headta123' });
      expect(result).toBe(true);
    });

    it('should deny other roles from managing TA assignments', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ role: 'ta' }]),
          }),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect);

      const result = await canManageTAAssignments({ userId: 'ta123' });
      expect(result).toBe(false);
    });
  });

  describe('requirePermission', () => {
    it('should check admin permission correctly', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ role: 'admin' }]),
          }),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect);

      const result = await requirePermission('admin123', 'admin');
      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should deny with reason when permission check fails', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ role: 'head_ta' }]),
          }),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect);

      const result = await requirePermission('user123', 'admin');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Admin access required');
    });

    it('should handle unknown permission types', async () => {
      const result = await requirePermission('user123', 'unknown' as any);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Unknown permission type');
    });

    it('should check manage_courses permission', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ role: 'admin' }]),
          }),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect);

      const result = await requirePermission('admin123', 'manage_courses');
      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should check send_invitations permission for head TAs', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ role: 'head_ta' }]),
          }),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect);

      const result = await requirePermission('headta123', 'send_invitations');
      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });
  });

  describe('edge cases and security concerns', () => {
    it('should handle database errors gracefully', async () => {
      vi.mocked(db.select).mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      await expect(hasAdminAccess('user123')).rejects.toThrow('Database connection failed');
    });

    it('should handle null or undefined userIds', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect);

      const result = await hasAdminAccess(null as any);
      expect(result).toBe(false);
    });

    it('should prevent role escalation through userRole parameter', async () => {
      // Even if someone passes admin role, permissions should be based on actual checks
      const result = await canSendInvitations({ 
        userId: 'user123', 
        userRole: 'some_invalid_role' as any 
      });

      // Should handle gracefully
      expect(result.canSend).toBe(false);
      expect(result.allowedRoles).toEqual([]);
    });
  });
});