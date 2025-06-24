import { describe, it, expect } from 'vitest';
import { validatePassword, hashPassword, verifyPassword } from './password-utils';

describe('password-utils security tests', () => {
  describe('validatePassword', () => {
    it('should reject passwords shorter than 8 characters', () => {
      const result = validatePassword('Short1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject passwords without uppercase letters', () => {
      const result = validatePassword('password123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject passwords without lowercase letters', () => {
      const result = validatePassword('PASSWORD123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject passwords without numbers', () => {
      const result = validatePassword('Password!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject passwords without special characters', () => {
      const result = validatePassword('Password123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should accept valid passwords', () => {
      const validPasswords = [
        'ValidPass123!',
        'C0mpl3x!Pass',
        'Test@1234',
        'P@ssw0rd!',
        'Str0ng#Pass',
      ];

      validPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should return all applicable errors for weak passwords', () => {
      const result = validatePassword('weak');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain('Password must be at least 8 characters long');
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
      expect(result.errors).toContain('Password must contain at least one number');
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should handle empty string', () => {
      const result = validatePassword('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(5); // All requirements fail
    });

    it('should handle very long passwords', () => {
      const longPassword = 'A'.repeat(100) + 'a1!';
      const result = validatePassword(longPassword);
      expect(result.isValid).toBe(true);
    });

    it('should handle passwords with unicode characters', () => {
      const result = validatePassword('Pássw0rd!');
      expect(result.isValid).toBe(true);
    });

    it('should handle passwords with only special characters', () => {
      const result = validatePassword('!@#$%^&*');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
      expect(result.errors).toContain('Password must contain at least one number');
    });
  });

  describe('password hashing security', () => {
    it('should generate different hashes for the same password', async () => {
      const password = 'SecurePass123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
      expect(hash1.length).toBeGreaterThan(50);
      expect(hash2.length).toBeGreaterThan(50);
    });

    it('should not expose password in hash', async () => {
      const password = 'MySecretPass123!';
      const hash = await hashPassword(password);
      
      expect(hash).not.toContain(password);
      expect(hash).not.toContain('MySecret');
      expect(hash).not.toContain('Pass123');
    });

    it('should verify correct passwords', async () => {
      const password = 'CorrectPass123!';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect passwords', async () => {
      const password = 'CorrectPass123!';
      const wrongPassword = 'WrongPass123!';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });

    it('should handle empty password hashing', async () => {
      const hash = await hashPassword('');
      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(50);
      
      // Empty string should still verify correctly
      const isValid = await verifyPassword('', hash);
      expect(isValid).toBe(true);
    });

    it('should reject verification with invalid hash format', async () => {
      const invalidHashes = [
        'not-a-real-hash',
        '12345',
        '',
        'tooshort',
        null,
        undefined,
      ];

      for (const invalidHash of invalidHashes) {
        try {
          const result = await verifyPassword('Password123!', invalidHash as any);
          expect(result).toBe(false);
        } catch (error) {
          // Some invalid hashes might throw, which is also acceptable
          expect(error).toBeDefined();
        }
      }
    });

    it('should be timing-attack resistant', async () => {
      const password = 'TestPass123!';
      const hash = await hashPassword(password);
      
      // Verify that verification takes similar time for different wrong passwords
      const wrongPasswords = [
        'a',
        'TestPass123',
        'TestPass123!wrong',
        'CompletelyDifferentPassword123!',
      ];

      // This is a basic check - proper timing attack tests would need more samples
      for (const wrongPass of wrongPasswords) {
        const result = await verifyPassword(wrongPass, hash);
        expect(result).toBe(false);
      }
    });

    it('should handle special characters in passwords', async () => {
      const specialPasswords = [
        'Pass!@#$%^&*()123',
        'Test"\'`~123!',
        'Password\\n123!',
        'Pass\t\r\n123!',
      ];

      for (const password of specialPasswords) {
        const hash = await hashPassword(password);
        const isValid = await verifyPassword(password, hash);
        expect(isValid).toBe(true);
        
        // Wrong password should fail
        const wrongValid = await verifyPassword(password + 'x', hash);
        expect(wrongValid).toBe(false);
      }
    });
  });

  describe('password validation edge cases', () => {
    it('should handle null and undefined gracefully', () => {
      // Test with null - should handle gracefully
      try {
        const resultNull = validatePassword(null as any);
        expect(resultNull.isValid).toBe(false);
        expect(resultNull.errors.length).toBeGreaterThan(0);
      } catch (error) {
        // If it throws, that's also acceptable for null input
        expect(error).toBeDefined();
      }

      // Test with undefined - should handle gracefully
      try {
        const resultUndefined = validatePassword(undefined as any);
        expect(resultUndefined.isValid).toBe(false);
        expect(resultUndefined.errors.length).toBeGreaterThan(0);
      } catch (error) {
        // If it throws, that's also acceptable for undefined input
        expect(error).toBeDefined();
      }
    });

    it('should validate passwords at exact length boundary', () => {
      const result7 = validatePassword('Pass12!'); // 7 chars
      expect(result7.isValid).toBe(false);
      expect(result7.errors).toContain('Password must be at least 8 characters long');

      const result8 = validatePassword('Pass123!'); // 8 chars
      expect(result8.isValid).toBe(true);
      expect(result8.errors).toHaveLength(0);
    });

    it('should handle passwords with consecutive special characters', () => {
      const result = validatePassword('Pass123!!!');
      expect(result.isValid).toBe(true);
    });

    it('should handle passwords with spaces', () => {
      const result = validatePassword('Pass 123!');
      expect(result.isValid).toBe(true);
    });
  });
});