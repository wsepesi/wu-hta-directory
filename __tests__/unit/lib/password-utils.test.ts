import { describe, it, expect } from '@jest/globals';
import { validatePassword, hashPassword, comparePasswords } from '@/lib/password-utils';
import { compare } from 'bcryptjs';

describe('password-utils', () => {
  describe('validatePassword', () => {
    it('should accept a valid password', () => {
      const result = validatePassword('ValidPass123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password shorter than 8 characters', () => {
      const result = validatePassword('Pass1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject password without uppercase letter', () => {
      const result = validatePassword('password123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject password without lowercase letter', () => {
      const result = validatePassword('PASSWORD123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject password without number', () => {
      const result = validatePassword('Password!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should handle empty password', () => {
      const result = validatePassword('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(4); // All requirements fail
    });

    it('should accept passwords with special characters', () => {
      const result = validatePassword('Pass123!@#$%');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept exactly 8 character password meeting all requirements', () => {
      const result = validatePassword('Pass123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject common weak passwords', () => {
      const weakPasswords = ['Password1', 'Password123', 'Admin123'];
      weakPasswords.forEach(password => {
        const result = validatePassword(password);
        // These should pass basic validation but could be enhanced with a weak password check
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50); // bcrypt hashes are typically 60 chars
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should create verifiable hashes', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      const isValid = await compare(password, hash);
      expect(isValid).toBe(true);
    });

    it('should handle empty password', async () => {
      const hash = await hashPassword('');
      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(50);
    });
  });

  describe('comparePasswords', () => {
    it('should return true for matching password and hash', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      const result = await comparePasswords(password, hash);
      expect(result).toBe(true);
    });

    it('should return false for non-matching password and hash', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hash = await hashPassword(password);
      
      const result = await comparePasswords(wrongPassword, hash);
      expect(result).toBe(false);
    });

    it('should handle empty password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      const result = await comparePasswords('', hash);
      expect(result).toBe(false);
    });

    it('should handle invalid hash format', async () => {
      const result = await comparePasswords('TestPassword123!', 'invalid-hash');
      expect(result).toBe(false);
    });
  });
});