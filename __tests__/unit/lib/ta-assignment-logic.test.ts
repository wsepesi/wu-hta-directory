import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  canAssignTA,
  calculateTAWorkload,
  suggestTAAssignments,
} from '@/lib/ta-assignment-logic';
import { db } from '@/lib/db';

// Mock the database
jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn(),
  },
}));

describe('ta-assignment-logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('canAssignTA', () => {
    it('should reject non-existent users', async () => {
      jest.mocked(db.select).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      const result = await canAssignTA('invalid-user-id', 'course-offering-1', 10);

      expect(result.canAssign).toBe(false);
      expect(result.reasons).toContain('User not found');
    });

    it('should reject non-head-TA users', async () => {
      jest.mocked(db.select).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 'user-1', role: 'admin' }]),
          }),
        }),
      } as any);

      const result = await canAssignTA('user-1', 'course-offering-1', 10);

      expect(result.canAssign).toBe(false);
      expect(result.reasons).toContain('User is not a head TA');
    });

    it('should reject non-existent course offerings', async () => {
      // Mock user query
      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 'user-1', role: 'head_ta' }]),
          }),
        }),
      } as any);

      // Mock course offering query
      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      const result = await canAssignTA('user-1', 'invalid-offering', 10);

      expect(result.canAssign).toBe(false);
      expect(result.reasons).toContain('Course offering not found');
    });

    it('should reject duplicate assignments', async () => {
      // Mock user query
      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 'user-1', role: 'head_ta' }]),
          }),
        }),
      } as any);

      // Mock course offering query
      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 'offering-1', year: 2024, season: 'fall' }]),
          }),
        }),
      } as any);

      // Mock existing assignment query
      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 'assignment-1' }]),
          }),
        }),
      } as any);

      const result = await canAssignTA('user-1', 'offering-1', 10);

      expect(result.canAssign).toBe(false);
      expect(result.reasons).toContain('TA is already assigned to this course');
    });

    it('should reject assignments exceeding maximum hours', async () => {
      // Mock user query
      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 'user-1', role: 'head_ta' }]),
          }),
        }),
      } as any);

      // Mock course offering query
      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 'offering-1', year: 2024, season: 'fall' }]),
          }),
        }),
      } as any);

      // Mock no existing assignment
      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      // Mock workload calculation - already at 15 hours
      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            innerJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([
                { hoursPerWeek: 15, courseNumber: '6.033', courseName: 'Systems', semester: 'Fall 2024' },
              ]),
            }),
          }),
        }),
      } as any);

      const result = await canAssignTA('user-1', 'offering-1', 10);

      expect(result.canAssign).toBe(false);
      expect(result.currentHours).toBe(15);
      expect(result.maxHours).toBe(20);
      expect(result.reasons).toContain('Adding 10 hours would exceed maximum of 20 hours per week');
    });

    it('should warn about too many course assignments', async () => {
      // Mock user query
      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 'user-1', role: 'head_ta' }]),
          }),
        }),
      } as any);

      // Mock course offering query
      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 'offering-1', year: 2024, season: 'fall' }]),
          }),
        }),
      } as any);

      // Mock no existing assignment
      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      // Mock workload calculation - 3 courses
      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            innerJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([
                { hoursPerWeek: 5, courseNumber: '6.033', courseName: 'Systems', semester: 'Fall 2024' },
                { hoursPerWeek: 5, courseNumber: '6.034', courseName: 'AI', semester: 'Fall 2024' },
                { hoursPerWeek: 5, courseNumber: '6.046', courseName: 'Algorithms', semester: 'Fall 2024' },
              ]),
            }),
          }),
        }),
      } as any);

      const result = await canAssignTA('user-1', 'offering-1', 5);

      expect(result.canAssign).toBe(false);
      expect(result.reasons).toContain('TA already has 3 course assignments this semester');
    });

    it('should allow valid assignments', async () => {
      // Mock user query
      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 'user-1', role: 'head_ta' }]),
          }),
        }),
      } as any);

      // Mock course offering query
      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 'offering-1', year: 2024, season: 'fall' }]),
          }),
        }),
      } as any);

      // Mock no existing assignment
      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      // Mock workload calculation - under limits
      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            innerJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([
                { hoursPerWeek: 5, courseNumber: '6.033', courseName: 'Systems', semester: 'Fall 2024' },
              ]),
            }),
          }),
        }),
      } as any);

      const result = await canAssignTA('user-1', 'offering-1', 10);

      expect(result.canAssign).toBe(true);
      expect(result.currentHours).toBe(5);
      expect(result.reasons).toHaveLength(0);
    });
  });

  describe('calculateTAWorkload', () => {
    it('should calculate total hours with default values', async () => {
      const mockAssignments = [
        {
          assignmentId: 'a1',
          hoursPerWeek: 15,
          courseNumber: '6.033',
          courseName: 'Systems',
          semester: 'Fall 2024',
          year: 2024,
          season: 'fall',
        },
        {
          assignmentId: 'a2',
          hoursPerWeek: null, // Should default to 10
          courseNumber: '6.034',
          courseName: 'AI',
          semester: 'Fall 2024',
          year: 2024,
          season: 'fall',
        },
      ];

      jest.mocked(db.select).mockReturnValue({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            innerJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue(mockAssignments),
            }),
          }),
        }),
      } as any);

      const result = await calculateTAWorkload('user-1');

      expect(result.userId).toBe('user-1');
      expect(result.totalHoursPerWeek).toBe(25); // 15 + 10
      expect(result.assignments).toHaveLength(2);
      expect(result.assignments[0].hoursPerWeek).toBe(15);
      expect(result.assignments[1].hoursPerWeek).toBe(10);
    });

    it('should filter by semester when provided', async () => {
      const mockAssignments = [
        {
          assignmentId: 'a1',
          hoursPerWeek: 10,
          courseNumber: '6.033',
          courseName: 'Systems',
          semester: 'Fall 2024',
          year: 2024,
          season: 'fall',
        },
      ];

      jest.mocked(db.select).mockReturnValue({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            innerJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                where: jest.fn().mockResolvedValue(mockAssignments),
              }),
            }),
          }),
        }),
      } as any);

      const result = await calculateTAWorkload('user-1', 2024, 'fall');

      expect(result.totalHoursPerWeek).toBe(10);
      expect(result.assignments).toHaveLength(1);
    });

    it('should return zero hours for TAs with no assignments', async () => {
      jest.mocked(db.select).mockReturnValue({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            innerJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      } as any);

      const result = await calculateTAWorkload('user-1');

      expect(result.totalHoursPerWeek).toBe(0);
      expect(result.assignments).toHaveLength(0);
    });
  });

  describe('suggestTAAssignments', () => {
    it('should suggest TAs based on availability and experience', async () => {
      // Mock course offering details
      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{
                courseId: 'course-1',
                year: 2024,
                season: 'fall',
                courseNumber: '6.033',
                courseName: 'Computer Systems',
              }]),
            }),
          }),
        }),
      } as any);

      // Mock head TAs
      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([
            { id: 'ta-1', firstName: 'Alice', lastName: 'Smith', gradYear: 2022 },
            { id: 'ta-2', firstName: 'Bob', lastName: 'Jones', gradYear: 2023 },
          ]),
        }),
      } as any);

      // Mock canAssignTA for ta-1 (available)
      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 'ta-1', role: 'head_ta' }]),
          }),
        }),
      } as any);

      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 'offering-1', year: 2024, season: 'fall' }]),
          }),
        }),
      } as any);

      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      // Mock workload for ta-1 (low hours)
      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            innerJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([
                { hoursPerWeek: 5, courseNumber: '6.034', courseName: 'AI', semester: 'Fall 2024' },
              ]),
            }),
          }),
        }),
      } as any);

      // Mock previous assignments for ta-1 (has taught this course)
      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([
              { courseId: 'course-1' },
            ]),
          }),
        }),
      } as any);

      // Mock canAssignTA for ta-2 (available)
      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 'ta-2', role: 'head_ta' }]),
          }),
        }),
      } as any);

      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 'offering-1', year: 2024, season: 'fall' }]),
          }),
        }),
      } as any);

      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      // Mock workload for ta-2
      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            innerJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      } as any);

      // Mock previous assignments for ta-2 (no previous experience)
      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      const suggestions = await suggestTAAssignments('offering-1', 3);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.length).toBeLessThanOrEqual(3);

      // TA 1 should have higher score due to experience
      const ta1Suggestion = suggestions.find(s => s.userId === 'ta-1');
      const ta2Suggestion = suggestions.find(s => s.userId === 'ta-2');

      if (ta1Suggestion && ta2Suggestion) {
        expect(ta1Suggestion.score).toBeGreaterThan(ta2Suggestion.score);
        expect(ta1Suggestion.reasons).toContain('Has taught this course before');
        expect(ta1Suggestion.reasons).toContain('Has availability for more courses');
        expect(ta1Suggestion.reasons).toContain('Experienced TA (2+ years)');
      }
    });

    it('should return empty array for invalid course offering', async () => {
      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      } as any);

      const suggestions = await suggestTAAssignments('invalid-offering', 5);

      expect(suggestions).toHaveLength(0);
    });

    it('should suggest different hours based on course complexity', async () => {
      // Test for course starting with '6'
      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{
                courseId: 'course-1',
                year: 2024,
                season: 'fall',
                courseNumber: '6.824',
                courseName: 'Distributed Systems',
              }]),
            }),
          }),
        }),
      } as any);

      // Mock one available TA
      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([
            { id: 'ta-1', firstName: 'Alice', lastName: 'Smith', gradYear: 2023 },
          ]),
        }),
      } as any);

      // Mock availability check
      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 'ta-1', role: 'head_ta' }]),
          }),
        }),
      } as any);

      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 'offering-1', year: 2024, season: 'fall' }]),
          }),
        }),
      } as any);

      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            innerJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      } as any);

      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      const suggestions = await suggestTAAssignments('offering-1', 5);

      expect(suggestions[0].suggestedHours).toBe(15); // Higher hours for course starting with '6'
    });
  });
});