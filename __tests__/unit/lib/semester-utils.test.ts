import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  getCurrentSemester,
  getNextSemester,
  parseSemester,
  formatSemester,
  getSemesterRange,
  compareSemesters,
  isSemesterPast,
  isSemesterCurrent,
  isSemesterFuture,
} from '@/lib/semester-utils';

describe('semester-utils', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getCurrentSemester', () => {
    it('should return Fall semester for September through January', () => {
      // Test September (month = 8)
      jest.setSystemTime(new Date(2024, 8, 15)); // September 15, 2024
      let semester = getCurrentSemester();
      expect(semester.season).toBe('fall');
      expect(semester.year).toBe(2024);
      expect(semester.display).toBe('Fall 2024');
      expect(semester.startDate).toEqual(new Date(2024, 8, 1));
      expect(semester.endDate).toEqual(new Date(2025, 0, 31));

      // Test December (month = 11)
      jest.setSystemTime(new Date(2024, 11, 15)); // December 15, 2024
      semester = getCurrentSemester();
      expect(semester.season).toBe('fall');
      expect(semester.year).toBe(2024);

      // Test January (month = 0) - should be previous year's fall
      jest.setSystemTime(new Date(2025, 0, 15)); // January 15, 2025
      semester = getCurrentSemester();
      expect(semester.season).toBe('fall');
      expect(semester.year).toBe(2024); // Previous year
      expect(semester.display).toBe('Fall 2024');
    });

    it('should return Spring semester for February through May', () => {
      // Test February (month = 1)
      jest.setSystemTime(new Date(2024, 1, 15)); // February 15, 2024
      let semester = getCurrentSemester();
      expect(semester.season).toBe('spring');
      expect(semester.year).toBe(2024);
      expect(semester.display).toBe('Spring 2024');
      expect(semester.startDate).toEqual(new Date(2024, 1, 1));
      expect(semester.endDate).toEqual(new Date(2024, 4, 31));

      // Test May (month = 4)
      jest.setSystemTime(new Date(2024, 4, 15)); // May 15, 2024
      semester = getCurrentSemester();
      expect(semester.season).toBe('spring');
      expect(semester.year).toBe(2024);
    });

    it('should return Summer semester for June through August', () => {
      // Test June (month = 5)
      jest.setSystemTime(new Date(2024, 5, 15)); // June 15, 2024
      let semester = getCurrentSemester();
      expect(semester.season).toBe('summer');
      expect(semester.year).toBe(2024);
      expect(semester.display).toBe('Summer 2024');
      expect(semester.startDate).toEqual(new Date(2024, 5, 1));
      expect(semester.endDate).toEqual(new Date(2024, 7, 31));

      // Test August (month = 7)
      jest.setSystemTime(new Date(2024, 7, 15)); // August 15, 2024
      semester = getCurrentSemester();
      expect(semester.season).toBe('summer');
      expect(semester.year).toBe(2024);
    });

    it('should handle edge cases at month boundaries', () => {
      // Last day of August -> Summer
      jest.setSystemTime(new Date(2024, 7, 31, 23, 59, 59));
      let semester = getCurrentSemester();
      expect(semester.season).toBe('summer');

      // First day of September -> Fall
      jest.setSystemTime(new Date(2024, 8, 1, 0, 0, 0));
      semester = getCurrentSemester();
      expect(semester.season).toBe('fall');

      // Last day of January -> Fall (previous year)
      jest.setSystemTime(new Date(2024, 0, 31, 23, 59, 59));
      semester = getCurrentSemester();
      expect(semester.season).toBe('fall');
      expect(semester.year).toBe(2023);

      // First day of February -> Spring
      jest.setSystemTime(new Date(2024, 1, 1, 0, 0, 0));
      semester = getCurrentSemester();
      expect(semester.season).toBe('spring');
      expect(semester.year).toBe(2024);
    });
  });

  describe('getNextSemester', () => {
    it('should return correct next semester for each season', () => {
      // Fall -> Spring (next year)
      let current = { year: 2024, season: 'fall' as const, display: 'Fall 2024', startDate: new Date(), endDate: new Date() };
      let next = getNextSemester(current);
      expect(next.season).toBe('spring');
      expect(next.year).toBe(2025);

      // Spring -> Summer (same year)
      current = { year: 2024, season: 'spring' as const, display: 'Spring 2024', startDate: new Date(), endDate: new Date() };
      next = getNextSemester(current);
      expect(next.season).toBe('summer');
      expect(next.year).toBe(2024);

      // Summer -> Fall (same year)
      current = { year: 2024, season: 'summer' as const, display: 'Summer 2024', startDate: new Date(), endDate: new Date() };
      next = getNextSemester(current);
      expect(next.season).toBe('fall');
      expect(next.year).toBe(2024);
    });

    it('should use current semester if none provided', () => {
      jest.setSystemTime(new Date(2024, 8, 15)); // September 15, 2024 (Fall)
      const next = getNextSemester();
      expect(next.season).toBe('spring');
      expect(next.year).toBe(2025);
    });
  });

  describe('parseSemester', () => {
    it('should parse valid semester strings', () => {
      // Test various formats
      let semester = parseSemester('Fall 2024');
      expect(semester.year).toBe(2024);
      expect(semester.season).toBe('fall');
      expect(semester.display).toBe('Fall 2024');

      semester = parseSemester('spring 2023');
      expect(semester.year).toBe(2023);
      expect(semester.season).toBe('spring');
      expect(semester.display).toBe('Spring 2023');

      semester = parseSemester('SUMMER 2025');
      expect(semester.year).toBe(2025);
      expect(semester.season).toBe('summer');
      expect(semester.display).toBe('Summer 2025');
    });

    it('should handle extra whitespace', () => {
      const semester = parseSemester('  fall    2024  ');
      expect(semester.year).toBe(2024);
      expect(semester.season).toBe('fall');
    });

    it('should throw error for invalid format', () => {
      expect(() => parseSemester('Fall')).toThrow('Invalid semester format');
      expect(() => parseSemester('2024')).toThrow('Invalid semester format');
      expect(() => parseSemester('Fall 2024 Extra')).toThrow('Invalid semester format');
      expect(() => parseSemester('')).toThrow('Invalid semester format');
    });

    it('should throw error for invalid season', () => {
      expect(() => parseSemester('Winter 2024')).toThrow('Invalid season: winter');
      expect(() => parseSemester('autumn 2024')).toThrow('Invalid season: autumn');
    });

    it('should throw error for invalid year', () => {
      expect(() => parseSemester('Fall abc')).toThrow('Invalid year: abc');
      expect(() => parseSemester('Fall 1899')).toThrow('Invalid year: 1899');
      expect(() => parseSemester('Fall 2101')).toThrow('Invalid year: 2101');
    });

    it('should set correct date ranges', () => {
      let semester = parseSemester('Fall 2024');
      expect(semester.startDate).toEqual(new Date(2024, 8, 1));
      expect(semester.endDate).toEqual(new Date(2025, 0, 31));

      semester = parseSemester('Spring 2024');
      expect(semester.startDate).toEqual(new Date(2024, 1, 1));
      expect(semester.endDate).toEqual(new Date(2024, 4, 31));

      semester = parseSemester('Summer 2024');
      expect(semester.startDate).toEqual(new Date(2024, 5, 1));
      expect(semester.endDate).toEqual(new Date(2024, 7, 31));
    });
  });

  describe('formatSemester', () => {
    it('should format semester correctly', () => {
      expect(formatSemester(2024, 'fall')).toBe('Fall 2024');
      expect(formatSemester(2023, 'spring')).toBe('Spring 2023');
      expect(formatSemester(2025, 'summer')).toBe('Summer 2025');
    });
  });

  describe('getSemesterRange', () => {
    it('should generate correct semester range', () => {
      const range = getSemesterRange(2023, 'fall', 2024, 'spring', false);
      expect(range).toHaveLength(2);
      expect(range[0].display).toBe('Fall 2023');
      expect(range[1].display).toBe('Spring 2024');
    });

    it('should include summer when requested', () => {
      const range = getSemesterRange(2023, 'spring', 2023, 'fall', true);
      expect(range).toHaveLength(3);
      expect(range[0].display).toBe('Spring 2023');
      expect(range[1].display).toBe('Summer 2023');
      expect(range[2].display).toBe('Fall 2023');
    });

    it('should exclude summer by default', () => {
      const range = getSemesterRange(2023, 'spring', 2023, 'fall', false);
      expect(range).toHaveLength(2);
      expect(range[0].display).toBe('Spring 2023');
      expect(range[1].display).toBe('Fall 2023');
    });

    it('should handle multi-year ranges', () => {
      const range = getSemesterRange(2022, 'fall', 2024, 'spring', false);
      expect(range).toHaveLength(4);
      expect(range[0].display).toBe('Fall 2022');
      expect(range[1].display).toBe('Spring 2023');
      expect(range[2].display).toBe('Fall 2023');
      expect(range[3].display).toBe('Spring 2024');
    });

    it('should handle single semester range', () => {
      const range = getSemesterRange(2024, 'fall', 2024, 'fall', false);
      expect(range).toHaveLength(1);
      expect(range[0].display).toBe('Fall 2024');
    });
  });

  describe('compareSemesters', () => {
    it('should compare semesters correctly', () => {
      const fall2023 = parseSemester('Fall 2023');
      const spring2024 = parseSemester('Spring 2024');
      const fall2024 = parseSemester('Fall 2024');

      // Different years
      expect(compareSemesters(fall2023, spring2024)).toBeLessThan(0);
      expect(compareSemesters(spring2024, fall2023)).toBeGreaterThan(0);

      // Same year, different seasons
      expect(compareSemesters(spring2024, fall2024)).toBeLessThan(0);
      expect(compareSemesters(fall2024, spring2024)).toBeGreaterThan(0);

      // Same semester
      expect(compareSemesters(fall2023, fall2023)).toBe(0);
    });

    it('should handle all season orderings correctly', () => {
      const spring = parseSemester('Spring 2024');
      const summer = parseSemester('Summer 2024');
      const fall = parseSemester('Fall 2024');

      expect(compareSemesters(spring, summer)).toBeLessThan(0);
      expect(compareSemesters(summer, fall)).toBeLessThan(0);
      expect(compareSemesters(spring, fall)).toBeLessThan(0);
    });
  });

  describe('semester comparison helpers', () => {
    beforeEach(() => {
      // Set current time to Fall 2024
      jest.setSystemTime(new Date(2024, 8, 15)); // September 15, 2024
    });

    describe('isSemesterPast', () => {
      it('should correctly identify past semesters', () => {
        const past = parseSemester('Spring 2024');
        const current = parseSemester('Fall 2024');
        const future = parseSemester('Spring 2025');

        expect(isSemesterPast(past)).toBe(true);
        expect(isSemesterPast(current)).toBe(false);
        expect(isSemesterPast(future)).toBe(false);
      });
    });

    describe('isSemesterCurrent', () => {
      it('should correctly identify current semester', () => {
        const past = parseSemester('Spring 2024');
        const current = parseSemester('Fall 2024');
        const future = parseSemester('Spring 2025');

        expect(isSemesterCurrent(past)).toBe(false);
        expect(isSemesterCurrent(current)).toBe(true);
        expect(isSemesterCurrent(future)).toBe(false);
      });
    });

    describe('isSemesterFuture', () => {
      it('should correctly identify future semesters', () => {
        const past = parseSemester('Spring 2024');
        const current = parseSemester('Fall 2024');
        const future = parseSemester('Spring 2025');

        expect(isSemesterFuture(past)).toBe(false);
        expect(isSemesterFuture(current)).toBe(false);
        expect(isSemesterFuture(future)).toBe(true);
      });
    });
  });

  describe('edge cases and error conditions', () => {
    it('should handle leap year February correctly', () => {
      const semester = parseSemester('Spring 2024'); // 2024 is a leap year
      expect(semester.endDate.getDate()).toBe(31); // May 31
      expect(semester.endDate.getMonth()).toBe(4); // May (0-indexed)
    });

    it('should handle year boundaries correctly', () => {
      // Fall semester crossing year boundary
      const fall2024 = parseSemester('Fall 2024');
      expect(fall2024.startDate.getFullYear()).toBe(2024);
      expect(fall2024.endDate.getFullYear()).toBe(2025);
    });

    it('should maintain consistency across multiple operations', () => {
      const original = parseSemester('Fall 2024');
      const formatted = formatSemester(original.year, original.season);
      const reparsed = parseSemester(formatted);

      expect(reparsed.year).toBe(original.year);
      expect(reparsed.season).toBe(original.season);
      expect(reparsed.display).toBe(original.display);
    });
  });
});