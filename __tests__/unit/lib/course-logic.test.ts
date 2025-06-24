import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  predictCourseOfferings,
  validateCourseOffering,
  findMissingTAAssignments,
} from '@/lib/course-logic';
import { db } from '@/lib/db';

// Mock the database
jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('course-logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('predictCourseOfferings', () => {
    it('should predict courses with "both" pattern for any semester', async () => {
      const mockCourses = [
        {
          id: 'course-1',
          courseNumber: '6.1200',
          courseName: 'Mathematics for CS',
          offeringPattern: 'both',
        },
      ];

      const mockHistoricalOfferings = [
        { courseId: 'course-1', year: 2023, season: 'fall' },
        { courseId: 'course-1', year: 2024, season: 'spring' },
      ];

      jest.mocked(db.select).mockResolvedValueOnce(mockCourses);
      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue(mockHistoricalOfferings),
        }),
      } as any);

      const predictions = await predictCourseOfferings(2024, 'fall');

      expect(predictions).toHaveLength(1);
      expect(predictions[0]).toMatchObject({
        courseId: 'course-1',
        courseNumber: '6.1200',
        courseName: 'Mathematics for CS',
        predictedYear: 2024,
        predictedSeason: 'fall',
        confidence: 'high',
        reason: 'Course is offered every semester',
      });
    });

    it('should predict fall-only courses only for fall semester', async () => {
      const mockCourses = [
        {
          id: 'course-2',
          courseNumber: '6.033',
          courseName: 'Computer Systems',
          offeringPattern: 'fall',
        },
      ];

      jest.mocked(db.select).mockResolvedValueOnce(mockCourses);
      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue([]),
        }),
      } as any);

      const fallPredictions = await predictCourseOfferings(2024, 'fall');
      expect(fallPredictions).toHaveLength(1);
      expect(fallPredictions[0].confidence).toBe('high');

      // Reset mocks for spring test
      jest.clearAllMocks();
      jest.mocked(db.select).mockResolvedValueOnce(mockCourses);
      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue([]),
        }),
      } as any);

      const springPredictions = await predictCourseOfferings(2024, 'spring');
      expect(springPredictions).toHaveLength(0);
    });

    it('should predict alternating courses based on history', async () => {
      const mockCourses = [
        {
          id: 'course-3',
          courseNumber: '6.824',
          courseName: 'Distributed Systems',
          offeringPattern: 'alternating',
        },
      ];

      const mockHistoricalOfferings = [
        { courseId: 'course-3', year: 2022, season: 'fall' },
        { courseId: 'course-3', year: 2023, season: 'spring' },
      ];

      jest.mocked(db.select).mockResolvedValueOnce(mockCourses);
      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue(mockHistoricalOfferings),
        }),
      } as any);

      const predictions = await predictCourseOfferings(2024, 'fall');

      expect(predictions).toHaveLength(1);
      expect(predictions[0].confidence).toBe('medium');
      expect(predictions[0].reason).toBe('Course alternates semesters and is due');
    });

    it('should handle irregular pattern courses with statistical analysis', async () => {
      const mockCourses = [
        {
          id: 'course-4',
          courseNumber: '6.850',
          courseName: 'Advanced Algorithms',
          offeringPattern: 'irregular',
        },
      ];

      const mockHistoricalOfferings = [
        { courseId: 'course-4', year: 2020, season: 'fall' },
        { courseId: 'course-4', year: 2021, season: 'spring' },
        { courseId: 'course-4', year: 2022, season: 'fall' },
        { courseId: 'course-4', year: 2023, season: 'spring' },
      ];

      jest.mocked(db.select).mockResolvedValueOnce(mockCourses);
      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue(mockHistoricalOfferings),
        }),
      } as any);

      const predictions = await predictCourseOfferings(2024, 'fall');

      expect(predictions).toHaveLength(1);
      expect(predictions[0].confidence).toBe('low');
      expect(predictions[0].reason).toBe('Course has irregular pattern but frequent offerings');
    });

    it('should return empty array for courses with insufficient history', async () => {
      const mockCourses = [
        {
          id: 'course-5',
          courseNumber: '6.999',
          courseName: 'New Course',
          offeringPattern: 'irregular',
        },
      ];

      const mockHistoricalOfferings = [
        { courseId: 'course-5', year: 2023, season: 'fall' },
      ];

      jest.mocked(db.select).mockResolvedValueOnce(mockCourses);
      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue(mockHistoricalOfferings),
        }),
      } as any);

      const predictions = await predictCourseOfferings(2024, 'spring');

      expect(predictions).toHaveLength(0);
    });
  });

  describe('validateCourseOffering', () => {
    it('should validate year constraints', async () => {
      const currentYear = new Date().getFullYear();
      
      // Mock empty existing offerings
      jest.mocked(db.select).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      // Too far in the past
      const pastResult = await validateCourseOffering(
        'course-1',
        null,
        'Fall 2010',
        currentYear - 15,
        'fall'
      );
      expect(pastResult.isValid).toBe(false);
      expect(pastResult.errors).toContain('Year is too far in the past (more than 10 years)');

      // Too far in the future
      const futureResult = await validateCourseOffering(
        'course-1',
        null,
        'Fall 2030',
        currentYear + 5,
        'fall'
      );
      expect(futureResult.isValid).toBe(false);
      expect(futureResult.errors).toContain('Year is too far in the future (more than 2 years)');

      // Valid year
      const validResult = await validateCourseOffering(
        'course-1',
        null,
        'Fall 2024',
        currentYear,
        'fall'
      );
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);
    });

    it('should detect duplicate offerings', async () => {
      jest.mocked(db.select).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 'existing-offering' }]),
          }),
        }),
      } as any);

      const result = await validateCourseOffering(
        'course-1',
        null,
        'Fall 2024',
        2024,
        'fall'
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Course offering already exists for this semester');
    });

    it('should warn about pattern mismatches', async () => {
      // Mock no existing offering
      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      // Mock course with fall pattern
      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ offeringPattern: 'fall' }]),
          }),
        }),
      } as any);

      // Mock professor offerings (empty)
      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      } as any);

      const result = await validateCourseOffering(
        'course-1',
        'prof-1',
        'Spring 2024',
        2024,
        'spring'
      );

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Course is typically only offered in fall');
    });

    it('should warn about professor overload', async () => {
      // Mock no existing offering
      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      // Mock course
      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ offeringPattern: 'both' }]),
          }),
        }),
      } as any);

      // Mock professor with 3 courses
      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([
            { id: 'offering-1' },
            { id: 'offering-2' },
            { id: 'offering-3' },
          ]),
        }),
      } as any);

      const result = await validateCourseOffering(
        'course-1',
        'prof-1',
        'Fall 2024',
        2024,
        'fall'
      );

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Professor already has 3 or more courses this semester');
    });
  });

  describe('findMissingTAAssignments', () => {
    it('should find courses without TA assignments', async () => {
      const mockMissingAssignments = [
        {
          courseOfferingId: 'offering-1',
          courseNumber: '6.1200',
          courseName: 'Mathematics for CS',
          semester: 'Fall 2024',
          year: 2024,
          season: 'fall',
          professorId: 'prof-1',
          createdAt: new Date('2024-01-01'),
          taCount: 0,
        },
        {
          courseOfferingId: 'offering-2',
          courseNumber: '6.033',
          courseName: 'Computer Systems',
          semester: 'Fall 2024',
          year: 2024,
          season: 'fall',
          professorId: null,
          createdAt: new Date('2024-01-05'),
          taCount: 0,
        },
      ];

      const mockProfessors = [
        { id: 'prof-1', fullName: 'John Doe' },
      ];

      // Mock the main query
      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            leftJoin: jest.fn().mockReturnValue({
              groupBy: jest.fn().mockReturnValue({
                having: jest.fn().mockResolvedValue(mockMissingAssignments),
              }),
            }),
          }),
        }),
      } as any);

      // Mock the professors query
      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockProfessors),
        }),
      } as any);

      const result = await findMissingTAAssignments();

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        courseOfferingId: 'offering-1',
        courseNumber: '6.1200',
        courseName: 'Mathematics for CS',
        professorName: 'John Doe',
      });
      expect(result[1]).toMatchObject({
        courseOfferingId: 'offering-2',
        courseNumber: '6.033',
        courseName: 'Computer Systems',
        professorName: null,
      });
      expect(result[0].daysSinceCreated).toBeGreaterThan(0);
    });

    it('should handle empty results gracefully', async () => {
      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            leftJoin: jest.fn().mockReturnValue({
              groupBy: jest.fn().mockReturnValue({
                having: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      } as any);

      const result = await findMissingTAAssignments();

      expect(result).toHaveLength(0);
    });

    it('should calculate days since created correctly', async () => {
      const createdDate = new Date();
      createdDate.setDate(createdDate.getDate() - 7); // 7 days ago

      const mockMissingAssignments = [
        {
          courseOfferingId: 'offering-1',
          courseNumber: '6.1200',
          courseName: 'Mathematics for CS',
          semester: 'Fall 2024',
          year: 2024,
          season: 'fall',
          professorId: null,
          createdAt: createdDate,
          taCount: 0,
        },
      ];

      jest.mocked(db.select).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            leftJoin: jest.fn().mockReturnValue({
              groupBy: jest.fn().mockReturnValue({
                having: jest.fn().mockResolvedValue(mockMissingAssignments),
              }),
            }),
          }),
        }),
      } as any);

      const result = await findMissingTAAssignments();

      expect(result[0].daysSinceCreated).toBe(7);
    });
  });
});