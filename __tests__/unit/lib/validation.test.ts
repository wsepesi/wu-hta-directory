import { describe, it, expect } from '@jest/globals';
import {
  courseSchema,
  taAssignmentSchema,
  courseOfferingSchema,
  validateData,
  isValidCourseNumber,
} from '@/lib/validation';

describe('validation', () => {
  describe('courseSchema', () => {
    it('should validate correct course data', () => {
      const validCourse = {
        courseNumber: '6.1200',
        courseName: 'Mathematics for Computer Science',
        offeringPattern: 'both',
      };

      const result = courseSchema.safeParse(validCourse);
      expect(result.success).toBe(true);
    });

    it('should validate various course number formats', () => {
      const validFormats = [
        '6.1200',
        '18.06',
        '6.033J',
        'CS50',
        'MATH101',
        'PHY101A',
        '6.UAT',
      ];

      validFormats.forEach(courseNumber => {
        const result = courseSchema.safeParse({
          courseNumber,
          courseName: 'Test Course',
          offeringPattern: 'fall',
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid course number formats', () => {
      const invalidFormats = [
        '6.12.34',     // Too many dots
        'cs50',        // Lowercase
        '.033',        // Leading dot
        '6-1200',      // Wrong separator
        '6 1200',      // Space
        '',            // Empty
        'A'.repeat(21), // Too long
      ];

      invalidFormats.forEach(courseNumber => {
        const result = courseSchema.safeParse({
          courseNumber,
          courseName: 'Test Course',
          offeringPattern: 'fall',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('Invalid course number format');
        }
      });
    });

    it('should enforce required fields', () => {
      const result = courseSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map(i => i.message);
        expect(messages).toContain('Required'); // Zod default message
        expect(messages.filter(m => m === 'Required').length).toBe(3); // All 3 fields required
      }
    });

    it('should validate offering patterns', () => {
      const validPatterns = ['both', 'fall', 'spring', 'alternating', 'irregular'];
      
      validPatterns.forEach(pattern => {
        const result = courseSchema.safeParse({
          courseNumber: '6.033',
          courseName: 'Test Course',
          offeringPattern: pattern,
        });
        expect(result.success).toBe(true);
      });

      const result = courseSchema.safeParse({
        courseNumber: '6.033',
        courseName: 'Test Course',
        offeringPattern: 'winter', // Invalid
      });
      expect(result.success).toBe(false);
    });

    it('should enforce length limits', () => {
      // Course number too long
      let result = courseSchema.safeParse({
        courseNumber: 'A'.repeat(21),
        courseName: 'Test Course',
        offeringPattern: 'fall',
      });
      expect(result.success).toBe(false);

      // Course name too long
      result = courseSchema.safeParse({
        courseNumber: '6.033',
        courseName: 'A'.repeat(256),
        offeringPattern: 'fall',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('taAssignmentSchema', () => {
    it('should validate correct TA assignment data', () => {
      const validAssignment = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        courseOfferingId: '550e8400-e29b-41d4-a716-446655440001',
        hoursPerWeek: 15,
        responsibilities: 'Lead recitations and grade assignments',
      };

      const result = taAssignmentSchema.safeParse(validAssignment);
      expect(result.success).toBe(true);
    });

    it('should allow optional fields to be omitted', () => {
      const minimalAssignment = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        courseOfferingId: '550e8400-e29b-41d4-a716-446655440001',
      };

      const result = taAssignmentSchema.safeParse(minimalAssignment);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '550e8400-e29b-41d4-a716',
        '550e8400-e29b-41d4-a716-446655440000-extra',
        '12345',
        '',
      ];

      invalidUUIDs.forEach(uuid => {
        const result = taAssignmentSchema.safeParse({
          userId: uuid,
          courseOfferingId: '550e8400-e29b-41d4-a716-446655440001',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('Invalid user ID');
        }
      });
    });

    it('should validate hours constraints', () => {
      // Too few hours
      let result = taAssignmentSchema.safeParse({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        courseOfferingId: '550e8400-e29b-41d4-a716-446655440001',
        hoursPerWeek: 0,
      });
      expect(result.success).toBe(false);

      // Too many hours
      result = taAssignmentSchema.safeParse({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        courseOfferingId: '550e8400-e29b-41d4-a716-446655440001',
        hoursPerWeek: 41,
      });
      expect(result.success).toBe(false);

      // Valid hours
      result = taAssignmentSchema.safeParse({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        courseOfferingId: '550e8400-e29b-41d4-a716-446655440001',
        hoursPerWeek: 20,
      });
      expect(result.success).toBe(true);
    });

    it('should enforce responsibilities length limit', () => {
      const result = taAssignmentSchema.safeParse({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        courseOfferingId: '550e8400-e29b-41d4-a716-446655440001',
        responsibilities: 'A'.repeat(5001),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('courseOfferingSchema', () => {
    it('should validate correct course offering data', () => {
      const validOffering = {
        courseId: '550e8400-e29b-41d4-a716-446655440000',
        professorId: '550e8400-e29b-41d4-a716-446655440001',
        semester: 'Fall 2024',
        year: 2024,
        season: 'fall',
      };

      const result = courseOfferingSchema.safeParse(validOffering);
      expect(result.success).toBe(true);
    });

    it('should allow null professor', () => {
      const result = courseOfferingSchema.safeParse({
        courseId: '550e8400-e29b-41d4-a716-446655440000',
        professorId: null,
        semester: 'Fall 2024',
        year: 2024,
        season: 'fall',
      });
      expect(result.success).toBe(true);
    });

    it('should validate year constraints', () => {
      // Too early
      let result = courseOfferingSchema.safeParse({
        courseId: '550e8400-e29b-41d4-a716-446655440000',
        professorId: null,
        semester: 'Fall 1999',
        year: 1999,
        season: 'fall',
      });
      expect(result.success).toBe(false);

      // Too late
      result = courseOfferingSchema.safeParse({
        courseId: '550e8400-e29b-41d4-a716-446655440000',
        professorId: null,
        semester: 'Fall 2101',
        year: 2101,
        season: 'fall',
      });
      expect(result.success).toBe(false);
    });

    it('should validate season enum', () => {
      const validSeasons = ['fall', 'spring', 'summer'];
      
      validSeasons.forEach(season => {
        const result = courseOfferingSchema.safeParse({
          courseId: '550e8400-e29b-41d4-a716-446655440000',
          professorId: null,
          semester: `${season} 2024`,
          year: 2024,
          season: season,
        });
        expect(result.success).toBe(true);
      });

      const result = courseOfferingSchema.safeParse({
        courseId: '550e8400-e29b-41d4-a716-446655440000',
        professorId: null,
        semester: 'Winter 2024',
        year: 2024,
        season: 'winter',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('validateData', () => {
    it('should return success with parsed data for valid input', () => {
      const result = validateData(courseSchema, {
        courseNumber: '6.033',
        courseName: 'Computer Systems',
        offeringPattern: 'both',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          courseNumber: '6.033',
          courseName: 'Computer Systems',
          offeringPattern: 'both',
        });
      }
    });

    it('should return structured errors for invalid input', () => {
      const result = validateData(courseSchema, {
        courseNumber: '',
        courseName: '',
        offeringPattern: 'invalid',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toHaveProperty('courseNumber');
        expect(result.errors).toHaveProperty('courseName');
        expect(result.errors).toHaveProperty('offeringPattern');
        expect(result.errors.courseNumber).toContain('Course number is required');
        expect(result.errors.courseName).toContain('Course name is required');
      }
    });

    it('should handle nested path errors correctly', () => {
      const nestedSchema = courseSchema.extend({
        metadata: courseSchema.pick({ courseName: true }),
      });

      const result = validateData(nestedSchema, {
        courseNumber: '6.033',
        courseName: 'Test',
        offeringPattern: 'fall',
        metadata: {
          courseName: '', // Invalid
        },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toHaveProperty('metadata.courseName');
      }
    });
  });

  describe('isValidCourseNumber', () => {
    it('should validate MIT-style course numbers', () => {
      const mitNumbers = [
        '6.1200',
        '18.06',
        '6.033J',
        '14.01',
        '2.671',
      ];

      mitNumbers.forEach(num => {
        expect(isValidCourseNumber(num)).toBe(true);
      });
    });

    it('should validate generic course numbers', () => {
      const genericNumbers = [
        'CS50',
        'MATH101',
        'PHY201A',
        'ECON1',
        'BIO999Z',
      ];

      genericNumbers.forEach(num => {
        expect(isValidCourseNumber(num)).toBe(true);
      });
    });

    it('should reject invalid course numbers', () => {
      const invalidNumbers = [
        '6..1200',
        'cs50',  // lowercase
        '6-033',
        '6 033',
        'ABC',   // no numbers
        '123',   // no letters
        '',
        '6.',
        '.033',
      ];

      invalidNumbers.forEach(num => {
        expect(isValidCourseNumber(num)).toBe(false);
      });
    });
  });
});