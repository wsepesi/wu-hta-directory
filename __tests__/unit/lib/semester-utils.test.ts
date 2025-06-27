import { describe, it, expect, jest } from '@jest/globals';
import {
  getCurrentSemester,
  getNextSemester,
  formatSemester,
  parseSemester,
  compareSemesters,
  isSemesterPast,
  isSemesterCurrent,
  isSemesterFuture,
} from '@/lib/semester-utils';

describe('semester-utils', () => {
  describe('getCurrentSemester', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return Fall semester for September', () => {
      jest.setSystemTime(new Date('2024-09-15'));
      const semester = getCurrentSemester();
      expect(semester.season).toBe('fall');
      expect(semester.year).toBe(2024);
      expect(semester.display).toBe('Fall 2024');
    });

    it('should return Fall semester for January', () => {
      jest.setSystemTime(new Date('2024-01-15'));
      const semester = getCurrentSemester();
      expect(semester.season).toBe('fall');
      expect(semester.year).toBe(2023);
      expect(semester.display).toBe('Fall 2023');
    });

    it('should return Spring semester for March', () => {
      jest.setSystemTime(new Date('2024-03-15'));
      const semester = getCurrentSemester();
      expect(semester.season).toBe('spring');
      expect(semester.year).toBe(2024);
      expect(semester.display).toBe('Spring 2024');
    });

    it('should return Summer semester for July', () => {
      jest.setSystemTime(new Date('2024-07-15'));
      const semester = getCurrentSemester();
      expect(semester.season).toBe('summer');
      expect(semester.year).toBe(2024);
      expect(semester.display).toBe('Summer 2024');
    });
  });

  describe('formatSemester', () => {
    it('should format semesters correctly', () => {
      expect(formatSemester(2024, 'fall')).toBe('Fall 2024');
      expect(formatSemester(2024, 'spring')).toBe('Spring 2024');
      expect(formatSemester(2024, 'summer')).toBe('Summer 2024');
    });
  });

  describe('parseSemester', () => {
    it('should parse valid semester strings', () => {
      const result = parseSemester('Fall 2024');
      expect(result.season).toBe('fall');
      expect(result.year).toBe(2024);
    });

    it('should throw for invalid strings', () => {
      expect(() => parseSemester('Invalid')).toThrow();
      expect(() => parseSemester('Winter 2024')).toThrow();
    });
  });

  describe('getNextSemester', () => {
    it('should work with provided semester', () => {
      const fall2024 = { season: 'fall' as const, year: 2024, display: 'Fall 2024', startDate: new Date(), endDate: new Date() };
      const next = getNextSemester(fall2024);
      expect(next.season).toBe('spring');
      expect(next.year).toBe(2025);
    });
  });

  describe('compareSemesters', () => {
    it('should compare semesters correctly', () => {
      const fall2023 = parseSemester('Fall 2023');
      const spring2024 = parseSemester('Spring 2024');
      const fall2024 = parseSemester('Fall 2024');
      
      expect(compareSemesters(fall2023, spring2024)).toBeLessThan(0);
      expect(compareSemesters(spring2024, fall2023)).toBeGreaterThan(0);
      expect(compareSemesters(fall2024, fall2024)).toBe(0);
    });
  });
});