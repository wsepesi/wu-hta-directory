import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { 
  getCurrentUser, 
  hasPermission, 
  getUserInitials, 
  formatUserName 
} from '@/lib/auth-utils';
import { getServerSession } from 'next-auth';

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

// Mock authOptions
jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

describe('auth-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentUser', () => {
    it('should return the current user from session', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'head_ta',
      };

      (getServerSession as jest.MockedFunction<typeof getServerSession>).mockResolvedValue({
        user: mockUser,
        expires: '2024-12-31',
      });

      const user = await getCurrentUser();
      expect(user).toEqual(mockUser);
    });

    it('should return null if no session exists', async () => {
      (getServerSession as jest.MockedFunction<typeof getServerSession>).mockResolvedValue(null);

      const user = await getCurrentUser();
      expect(user).toBeNull();
    });

    it('should return null if session has no user', async () => {
      (getServerSession as jest.MockedFunction<typeof getServerSession>).mockResolvedValue({
        expires: '2024-12-31',
      } as any);

      const user = await getCurrentUser();
      expect(user).toBeNull();
    });
  });

  describe('hasPermission', () => {
    it('should return true if user has required role', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'admin',
      };

      (getServerSession as jest.MockedFunction<typeof getServerSession>).mockResolvedValue({
        user: mockUser,
        expires: '2024-12-31',
      });

      const hasAdmin = await hasPermission(['admin']);
      expect(hasAdmin).toBe(true);

      const hasAdminOrHeadTA = await hasPermission(['admin', 'head_ta']);
      expect(hasAdminOrHeadTA).toBe(true);
    });

    it('should return false if user does not have required role', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'head_ta',
      };

      (getServerSession as jest.MockedFunction<typeof getServerSession>).mockResolvedValue({
        user: mockUser,
        expires: '2024-12-31',
      });

      const hasAdmin = await hasPermission(['admin']);
      expect(hasAdmin).toBe(false);
    });

    it('should return false if no user is logged in', async () => {
      (getServerSession as jest.MockedFunction<typeof getServerSession>).mockResolvedValue(null);

      const hasPermission = await hasPermission(['admin']);
      expect(hasPermission).toBe(false);
    });
  });

  describe('getUserInitials', () => {
    it('should return uppercase initials', () => {
      expect(getUserInitials('John', 'Doe')).toBe('JD');
      expect(getUserInitials('jane', 'smith')).toBe('JS');
      expect(getUserInitials('Mary', 'Jane')).toBe('MJ');
    });

    it('should handle empty strings', () => {
      expect(getUserInitials('', '')).toBe('');
      expect(getUserInitials('John', '')).toBe('J');
      expect(getUserInitials('', 'Doe')).toBe('D');
    });

    it('should handle single character names', () => {
      expect(getUserInitials('A', 'B')).toBe('AB');
      expect(getUserInitials('x', 'y')).toBe('XY');
    });
  });

  describe('formatUserName', () => {
    it('should format full name correctly', () => {
      expect(formatUserName('John', 'Doe')).toBe('John Doe');
      expect(formatUserName('Jane', 'Smith')).toBe('Jane Smith');
      expect(formatUserName('Mary', 'Jane')).toBe('Mary Jane');
    });

    it('should handle empty strings', () => {
      expect(formatUserName('', '')).toBe(' ');
      expect(formatUserName('John', '')).toBe('John ');
      expect(formatUserName('', 'Doe')).toBe(' Doe');
    });

    it('should preserve case', () => {
      expect(formatUserName('JOHN', 'DOE')).toBe('JOHN DOE');
      expect(formatUserName('john', 'doe')).toBe('john doe');
      expect(formatUserName('JoHn', 'DoE')).toBe('JoHn DoE');
    });
  });
});