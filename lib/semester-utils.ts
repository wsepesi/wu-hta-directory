type Season = 'fall' | 'spring' | 'summer';

interface Semester {
  year: number;
  season: Season;
  display: string;
  startDate: Date;
  endDate: Date;
}

/**
 * Get the current semester based on the current date
 */
export function getCurrentSemester(): Semester {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11

  let season: Season;
  let startDate: Date;
  let endDate: Date;

  if (month >= 8 || month === 0) {
    // September through January is Fall
    season = 'fall';
    const semesterYear = month >= 8 ? year : year - 1;
    startDate = new Date(semesterYear, 8, 1); // September 1
    endDate = new Date(semesterYear + 1, 0, 31); // January 31
    return {
      year: semesterYear,
      season,
      display: `Fall ${semesterYear}`,
      startDate,
      endDate,
    };
  } else if (month >= 1 && month <= 4) {
    // February through May is Spring
    season = 'spring';
    startDate = new Date(year, 1, 1); // February 1
    endDate = new Date(year, 4, 31); // May 31
    return {
      year,
      season,
      display: `Spring ${year}`,
      startDate,
      endDate,
    };
  } else {
    // June through August is Summer
    season = 'summer';
    startDate = new Date(year, 5, 1); // June 1
    endDate = new Date(year, 7, 31); // August 31
    return {
      year,
      season,
      display: `Summer ${year}`,
      startDate,
      endDate,
    };
  }
}

/**
 * Get the next semester after the current one
 */
export function getNextSemester(current?: Semester): Semester {
  const currentSemester = current || getCurrentSemester();
  
  let nextYear = currentSemester.year;
  let nextSeason: Season;
  
  switch (currentSemester.season) {
    case 'fall':
      nextSeason = 'spring';
      nextYear = currentSemester.year + 1;
      break;
    case 'spring':
      nextSeason = 'summer';
      break;
    case 'summer':
      nextSeason = 'fall';
      break;
  }
  
  return parseSemester(`${nextSeason} ${nextYear}`);
}

/**
 * Parse a semester string into a structured object
 */
export function parseSemester(semesterString: string): Semester {
  const parts = semesterString.toLowerCase().trim().split(/\s+/);
  
  if (parts.length !== 2) {
    throw new Error('Invalid semester format. Expected "Season Year" (e.g., "Fall 2024")');
  }
  
  const seasonStr = parts[0];
  const yearStr = parts[1];
  
  // Validate season
  const validSeasons: Season[] = ['fall', 'spring', 'summer'];
  const season = validSeasons.find(s => s === seasonStr);
  
  if (!season) {
    throw new Error(`Invalid season: ${seasonStr}. Must be fall, spring, or summer`);
  }
  
  // Validate year
  const year = parseInt(yearStr, 10);
  if (isNaN(year) || year < 1900 || year > 2100) {
    throw new Error(`Invalid year: ${yearStr}`);
  }
  
  // Calculate dates
  let startDate: Date;
  let endDate: Date;
  
  switch (season) {
    case 'fall':
      startDate = new Date(year, 8, 1); // September 1
      endDate = new Date(year + 1, 0, 31); // January 31
      break;
    case 'spring':
      startDate = new Date(year, 1, 1); // February 1
      endDate = new Date(year, 4, 31); // May 31
      break;
    case 'summer':
      startDate = new Date(year, 5, 1); // June 1
      endDate = new Date(year, 7, 31); // August 31
      break;
  }
  
  return {
    year,
    season,
    display: formatSemester(year, season),
    startDate,
    endDate,
  };
}

/**
 * Format a semester for display
 */
export function formatSemester(year: number, season: Season): string {
  const capitalizedSeason = season.charAt(0).toUpperCase() + season.slice(1);
  return `${capitalizedSeason} ${year}`;
}

/**
 * Generate a range of semesters
 */
export function getSemesterRange(
  startYear: number,
  startSeason: Season,
  endYear: number,
  endSeason: Season,
  includeSum: boolean = false
): Semester[] {
  const semesters: Semester[] = [];
  
  let currentYear = startYear;
  let currentSeason = startSeason;
  
  while (
    currentYear < endYear ||
    (currentYear === endYear && getSeasonOrder(currentSeason) <= getSeasonOrder(endSeason))
  ) {
    if (includeSum || currentSeason !== 'summer') {
      semesters.push(parseSemester(`${currentSeason} ${currentYear}`));
    }
    
    // Move to next semester
    const nextSemesterData = getNextSemesterData(currentYear, currentSeason);
    currentYear = nextSemesterData.year;
    currentSeason = nextSemesterData.season;
  }
  
  return semesters;
}

/**
 * Compare two semesters
 * Returns: -1 if a < b, 0 if a = b, 1 if a > b
 */
export function compareSemesters(a: Semester, b: Semester): number {
  if (a.year !== b.year) {
    return a.year - b.year;
  }
  
  return getSeasonOrder(a.season) - getSeasonOrder(b.season);
}

/**
 * Check if a semester is in the past
 */
export function isSemesterPast(semester: Semester): boolean {
  const current = getCurrentSemester();
  return compareSemesters(semester, current) < 0;
}

/**
 * Check if a semester is current
 */
export function isSemesterCurrent(semester: Semester): boolean {
  const current = getCurrentSemester();
  return compareSemesters(semester, current) === 0;
}

/**
 * Check if a semester is in the future
 */
export function isSemesterFuture(semester: Semester): boolean {
  const current = getCurrentSemester();
  return compareSemesters(semester, current) > 0;
}

// Helper functions

function getSeasonOrder(season: Season): number {
  switch (season) {
    case 'spring':
      return 1;
    case 'summer':
      return 2;
    case 'fall':
      return 3;
    default:
      return 0;
  }
}

function getNextSemesterData(year: number, season: Season): { year: number; season: Season } {
  switch (season) {
    case 'spring':
      return { year, season: 'summer' };
    case 'summer':
      return { year, season: 'fall' };
    case 'fall':
      return { year: year + 1, season: 'spring' };
  }
}