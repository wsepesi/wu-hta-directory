import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  getCurrentUser, 
  requireAuth,
  requireAdmin,
  hasPermission,
  isAdmin,
  requireRole
} from './auth-utils';
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

// Mock dependencies
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

describe('auth-utils security tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('requireAuth', () => {
    it('should redirect to signin when user is not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      await requireAuth();

      expect(redirect).toHaveBeenCalledWith("/auth/signin");
    });

    it('should redirect with callback URL when provided', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      await requireAuth('/admin/users');

      expect(redirect).toHaveBeenCalledWith(
        "/auth/signin?callbackUrl=%2Fadmin%2Fusers"
      );
    });

    it('should return user when authenticated', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'head_ta',
      };

      vi.mocked(getServerSession).mockResolvedValue({
        user: mockUser,
        expires: '2024-12-31',
      });

      const user = await requireAuth();
      expect(user).toEqual(mockUser);
      expect(redirect).not.toHaveBeenCalled();
    });

    it('should handle URL injection attacks in redirectTo', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      // Test with malicious URL
      await requireAuth('https://evil.com/phishing');

      // Should properly encode the URL
      expect(redirect).toHaveBeenCalledWith(
        "/auth/signin?callbackUrl=https%3A%2F%2Fevil.com%2Fphishing"
      );
    });
  });

  describe('requireAdmin', () => {
    it('should redirect when user is not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      // requireAdmin will throw due to redirect, so we need to catch it
      try {
        await requireAdmin();
      } catch (error) {
        // Expected to throw due to redirect
      }

      expect(redirect).toHaveBeenCalledWith("/auth/signin");
    });

    it('should redirect to unauthorized when user is not admin', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'head_ta',
      };

      vi.mocked(getServerSession).mockResolvedValue({
        user: mockUser,
        expires: '2024-12-31',
      });

      await requireAdmin();

      expect(redirect).toHaveBeenCalledWith("/unauthorized");
    });

    it('should return user when user is admin', async () => {
      const mockAdmin = {
        id: '123',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
      };

      vi.mocked(getServerSession).mockResolvedValue({
        user: mockAdmin,
        expires: '2024-12-31',
      });

      const user = await requireAdmin();
      expect(user).toEqual(mockAdmin);
      expect(redirect).not.toHaveBeenCalled();
    });
  });

  describe('hasPermission', () => {
    it('should return false when user is not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const result = await hasPermission(['admin']);
      expect(result).toBe(false);
    });

    it('should return false when user role is not in allowed roles', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'head_ta',
      };

      vi.mocked(getServerSession).mockResolvedValue({
        user: mockUser,
        expires: '2024-12-31',
      });

      const result = await hasPermission(['admin']);
      expect(result).toBe(false);
    });

    it('should return true when user role is in allowed roles', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'admin',
      };

      vi.mocked(getServerSession).mockResolvedValue({
        user: mockUser,
        expires: '2024-12-31',
      });

      const result = await hasPermission(['admin', 'head_ta']);
      expect(result).toBe(true);
    });

    it('should handle empty allowed roles array', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'admin',
      };

      vi.mocked(getServerSession).mockResolvedValue({
        user: mockUser,
        expires: '2024-12-31',
      });

      const result = await hasPermission([]);
      expect(result).toBe(false);
    });
  });

  describe('requireRole', () => {
    it('should redirect to custom path when unauthorized', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'head_ta',
      };

      vi.mocked(getServerSession).mockResolvedValue({
        user: mockUser,
        expires: '2024-12-31',
      });

      await requireRole(['admin'], '/custom-unauthorized');

      expect(redirect).toHaveBeenCalledWith('/custom-unauthorized');
    });

    it('should handle case sensitivity in roles', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'Admin', // Different case
      };

      vi.mocked(getServerSession).mockResolvedValue({
        user: mockUser,
        expires: '2024-12-31',
      });

      await requireRole(['admin'], '/unauthorized');

      // Should redirect because 'Admin' !== 'admin'
      expect(redirect).toHaveBeenCalledWith('/unauthorized');
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin users', async () => {
      const mockAdmin = {
        id: '123',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
      };

      vi.mocked(getServerSession).mockResolvedValue({
        user: mockAdmin,
        expires: '2024-12-31',
      });

      const result = await isAdmin();
      expect(result).toBe(true);
    });

    it('should return false for non-admin users', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'head_ta',
      };

      vi.mocked(getServerSession).mockResolvedValue({
        user: mockUser,
        expires: '2024-12-31',
      });

      const result = await isAdmin();
      expect(result).toBe(false);
    });

    it('should return false when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const result = await isAdmin();
      expect(result).toBe(false);
    });
  });

  describe('session edge cases', () => {
    it('should handle malformed session objects', async () => {
      // Session without user property
      vi.mocked(getServerSession).mockResolvedValue({
        expires: '2024-12-31',
      } as any);

      const user = await getCurrentUser();
      expect(user).toBeNull();
    });

    it('should handle session with incomplete user data', async () => {
      // User without role
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: '123',
          email: 'test@example.com',
          // Missing role, firstName, lastName
        },
        expires: '2024-12-31',
      } as any);

      const result = await hasPermission(['admin']);
      expect(result).toBe(false);
    });
  });
});