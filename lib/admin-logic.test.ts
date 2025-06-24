import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  canDeleteUser,
  getUserInvitationTree,
} from './admin-logic';
import { db } from './db';

// Mock the database
vi.mock('./db', () => ({
  db: {
    select: vi.fn(),
  },
}));

describe('admin-logic security tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('canDeleteUser', () => {
    it('should prevent deletion of non-existent users', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect);

      const result = await canDeleteUser('nonexistent');
      expect(result.canDelete).toBe(false);
      expect(result.reasons).toContain('User not found');
    });

    it('should prevent deletion of users with TA assignments', async () => {
      // Mock user exists
      const mockSelectUser = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 'user123', role: 'head_ta' }]),
          }),
        }),
      });

      // Mock TA assignments count
      const mockSelectAssignments = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 3 }]),
        }),
      });

      vi.mocked(db.select)
        .mockImplementationOnce(mockSelectUser)
        .mockImplementationOnce(mockSelectAssignments)
        .mockImplementation(() => ({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: 0 }]),
          }),
        }));

      const result = await canDeleteUser('user123');
      expect(result.canDelete).toBe(false);
      expect(result.reasons).toContain('User has 3 TA assignment(s)');
      expect(result.dependencies.taAssignments).toBe(3);
    });

    it('should prevent deletion of the last admin', async () => {
      // Mock admin user
      const mockSelectUser = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 'admin123', role: 'admin' }]),
          }),
        }),
      });

      // Mock counts (all zero except admin count)
      const mockSelectCounts = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 0 }]),
        }),
      });

      // Mock admin count = 1
      const mockSelectAdminCount = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 1 }]),
        }),
      });

      vi.mocked(db.select)
        .mockImplementationOnce(mockSelectUser)
        .mockImplementationOnce(mockSelectCounts) // TA assignments
        .mockImplementationOnce(mockSelectCounts) // Invitations sent
        .mockImplementationOnce(mockSelectCounts) // Users invited
        .mockImplementationOnce(mockSelectCounts) // Active sessions
        .mockImplementationOnce(mockSelectAdminCount); // Admin count

      const result = await canDeleteUser('admin123');
      expect(result.canDelete).toBe(false);
      expect(result.reasons).toContain('Cannot delete the last administrator');
    });

    it('should check all dependencies before allowing deletion', async () => {
      // Mock user with various dependencies
      const mockSelectUser = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 'user123', role: 'head_ta' }]),
          }),
        }),
      });

      const mockCounts = [
        { count: 2 }, // TA assignments
        { count: 5 }, // Invitations sent
        { count: 3 }, // Users invited
        { count: 1 }, // Active sessions
      ];

      let countIndex = 0;
      vi.mocked(db.select)
        .mockImplementationOnce(mockSelectUser)
        .mockImplementation(() => ({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([mockCounts[countIndex++]]),
          }),
        }));

      const result = await canDeleteUser('user123');
      expect(result.canDelete).toBe(false);
      expect(result.reasons).toHaveLength(4);
      expect(result.dependencies).toEqual({
        taAssignments: 2,
        invitationsSent: 5,
        inviteesJoined: 3,
        sessions: 1,
      });
    });

    it('should allow deletion of users without dependencies', async () => {
      // Mock user exists
      const mockSelectUser = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 'user123', role: 'head_ta' }]),
          }),
        }),
      });

      // All counts are zero
      const mockSelectZero = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 0 }]),
        }),
      });

      vi.mocked(db.select)
        .mockImplementationOnce(mockSelectUser)
        .mockImplementation(mockSelectZero);

      const result = await canDeleteUser('user123');
      expect(result.canDelete).toBe(true);
      expect(result.reasons).toHaveLength(0);
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

      const result = await canDeleteUser("'; DROP TABLE users; --");
      expect(result.canDelete).toBe(false);
      expect(result.reasons).toContain('User not found');
    });
  });

  describe('getUserInvitationTree', () => {
    it('should prevent infinite loops with circular references', async () => {
      // Simple circular test: A invited B, B invited A
      const users = {
        userA: {
          id: 'userA',
          firstName: 'User',
          lastName: 'A',
          email: 'a@example.com',
          role: 'admin',
          createdAt: new Date(),
        },
        userB: {
          id: 'userB',
          firstName: 'User',
          lastName: 'B',
          email: 'b@example.com',
          role: 'head_ta',
          createdAt: new Date(),
        },
      };

      const mockCalls = [
        // Get user A
        { type: 'user', data: [users.userA] },
        // Get A's invitees (B)
        { type: 'invitees', data: [{ id: 'userB' }] },
        // Get user B
        { type: 'user', data: [users.userB] },
        // Get B's invitees (A - circular!)
        { type: 'invitees', data: [{ id: 'userA' }] },
        // Get user A again (circular reference) - should return data but maxDepth will prevent further recursion
        { type: 'user', data: [users.userA] },
        // Get A's invitees again - but we'll already be at maxDepth
        { type: 'invitees', data: [] },
      ];

      let callIndex = 0;
      vi.mocked(db.select).mockImplementation(() => {
        if (callIndex >= mockCalls.length) {
          // Return empty results if we go beyond expected calls
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([]),
              }),
            }),
          };
        }
        
        const call = mockCalls[callIndex++];
        if (call.type === 'user') {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue(call.data),
              }),
            }),
          };
        } else {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(call.data),
            }),
          };
        }
      });

      const tree = await getUserInvitationTree('userA', 2);
      
      // Should return a tree but prevent infinite recursion
      expect(tree).not.toBeNull();
      expect(tree?.id).toBe('userA');
      
      // Check that it doesn't go deeper than maxDepth
      let depth = 0;
      let current = tree;
      while (current && current.invitees.length > 0) {
        depth++;
        current = current.invitees[0];
      }
      expect(depth).toBeLessThanOrEqual(2);
    });

    it('should respect maxDepth parameter', async () => {
      // Create a deep invitation chain
      const createUser = (id: string) => ({
        id,
        firstName: 'User',
        lastName: id,
        email: `${id}@example.com`,
        role: 'head_ta',
        createdAt: new Date(),
      });

      // Pre-defined mock calls for a chain that goes deeper than maxDepth
      const mockCalls = [
        // Depth 0 - Get user0
        { type: 'user', data: [createUser('user0')] },
        // Get user0's invitees
        { type: 'invitees', data: [{ id: 'user1' }] },
        // Depth 1 - Get user1
        { type: 'user', data: [createUser('user1')] },
        // Get user1's invitees
        { type: 'invitees', data: [{ id: 'user2' }] },
        // Depth 2 - Get user2
        { type: 'user', data: [createUser('user2')] },
        // Get user2's invitees - should stop here due to maxDepth=2
        { type: 'invitees', data: [{ id: 'user3' }] },
      ];

      let callIndex = 0;
      vi.mocked(db.select).mockImplementation(() => {
        if (callIndex >= mockCalls.length) {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([]),
            }),
          };
        }
        
        const call = mockCalls[callIndex++];
        if (call.type === 'user') {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue(call.data),
              }),
            }),
          };
        } else {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(call.data),
            }),
          };
        }
      });

      const tree = await getUserInvitationTree('user0', 2);
      
      // Count depth
      let depth = 0;
      let current = tree;
      while (current && current.invitees.length > 0) {
        depth++;
        current = current.invitees[0];
      }
      
      expect(depth).toBeLessThanOrEqual(2);
    });

    it('should handle non-existent users', async () => {
      vi.mocked(db.select).mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }));

      const tree = await getUserInvitationTree('nonexistent');
      expect(tree).toBeNull();
    });

    it('should handle users with no invitees', async () => {
      const mockUser = {
        id: 'lonely123',
        firstName: 'Lonely',
        lastName: 'User',
        email: 'lonely@example.com',
        role: 'head_ta',
        createdAt: new Date(),
      };

      let callCount = 0;
      vi.mocked(db.select).mockImplementation(() => {
        if (callCount === 0) {
          callCount++;
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([mockUser]),
              }),
            }),
          };
        } else {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([]), // No invitees
            }),
          };
        }
      });

      const tree = await getUserInvitationTree('lonely123');
      expect(tree).not.toBeNull();
      expect(tree?.invitees).toHaveLength(0);
    });

    it('should build complete tree for valid hierarchy', async () => {
      // A invited B and C, B invited D
      const users = {
        A: { id: 'A', firstName: 'User', lastName: 'A', email: 'a@ex.com', role: 'admin', createdAt: new Date() },
        B: { id: 'B', firstName: 'User', lastName: 'B', email: 'b@ex.com', role: 'head_ta', createdAt: new Date() },
        C: { id: 'C', firstName: 'User', lastName: 'C', email: 'c@ex.com', role: 'head_ta', createdAt: new Date() },
        D: { id: 'D', firstName: 'User', lastName: 'D', email: 'd@ex.com', role: 'head_ta', createdAt: new Date() },
      };

      const mockCalls = [
        // Get user A
        { type: 'user', data: [users.A] },
        // Get A's invitees (B and C)
        { type: 'invitees', data: [{ id: 'B' }, { id: 'C' }] },
        // Get user B
        { type: 'user', data: [users.B] },
        // Get B's invitees (D)
        { type: 'invitees', data: [{ id: 'D' }] },
        // Get user D
        { type: 'user', data: [users.D] },
        // Get D's invitees (none)
        { type: 'invitees', data: [] },
        // Get user C
        { type: 'user', data: [users.C] },
        // Get C's invitees (none)
        { type: 'invitees', data: [] },
      ];

      let callIndex = 0;
      vi.mocked(db.select).mockImplementation(() => {
        const call = mockCalls[callIndex++];
        if (call.type === 'user') {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue(call.data),
              }),
            }),
          };
        } else {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(call.data),
            }),
          };
        }
      });

      const tree = await getUserInvitationTree('A');
      
      expect(tree).not.toBeNull();
      expect(tree?.id).toBe('A');
      expect(tree?.invitees).toHaveLength(2);
      expect(tree?.invitees[0].id).toBe('B');
      expect(tree?.invitees[1].id).toBe('C');
      expect(tree?.invitees[0].invitees).toHaveLength(1);
      expect(tree?.invitees[0].invitees[0].id).toBe('D');
    });
  });

  describe('security edge cases', () => {
    it('should handle database errors gracefully in canDeleteUser', async () => {
      vi.mocked(db.select).mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      await expect(canDeleteUser('user123')).rejects.toThrow('Database connection failed');
    });

    it('should handle database errors gracefully in getUserInvitationTree', async () => {
      vi.mocked(db.select).mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      await expect(getUserInvitationTree('user123')).rejects.toThrow('Database connection failed');
    });

    it('should handle null/undefined userId in canDeleteUser', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect);

      const resultNull = await canDeleteUser(null as any);
      expect(resultNull.canDelete).toBe(false);
      expect(resultNull.reasons).toContain('User not found');

      const resultUndefined = await canDeleteUser(undefined as any);
      expect(resultUndefined.canDelete).toBe(false);
      expect(resultUndefined.reasons).toContain('User not found');
    });
  });
});