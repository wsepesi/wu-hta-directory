import { z } from 'zod';

// User validation schemas
export const userRegistrationSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  gradYear: z.number().int().min(1900).max(2100).optional(),
  degreeProgram: z.string().max(255).optional(),
  currentRole: z.string().max(255).optional(),
  linkedinUrl: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  personalSite: z.string().url('Invalid website URL').optional().or(z.literal('')),
  location: z.string().max(255).optional(),
});

export const userUpdateSchema = userRegistrationSchema
  .omit({ email: true, password: true })
  .partial();

// Course validation schemas
export const courseSchema = z.object({
  courseNumber: z.string()
    .min(1, 'Course number is required')
    .max(20)
    .regex(/^\d+[A-Z]?$/, 'Invalid course number format. Use formats like 131 or 417T'),
  courseName: z.string().min(1, 'Course name is required').max(255),
});

// Professor validation schemas
export const professorSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address'),
});

// Course offering validation schemas
export const courseOfferingSchema = z.object({
  courseId: z.string().uuid('Invalid course ID'),
  professorId: z.string().uuid('Invalid professor ID').nullable(),
  semester: z.string().max(50),
  year: z.number().int().min(2000).max(2100),
  season: z.enum(['fall', 'spring', 'summer']),
});

// TA assignment validation schemas
export const taAssignmentSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  courseOfferingId: z.string().uuid('Invalid course offering ID'),
  hoursPerWeek: z.number().int().min(1).max(40).optional(),
  responsibilities: z.string().max(5000).optional(),
});

// Invitation validation schemas
export const invitationSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['head_ta', 'admin']).default('head_ta'),
});

// Search validation schemas
export const searchQuerySchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100),
  type: z.enum(['all', 'users', 'courses', 'professors']).optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

// Semester validation
export const semesterSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  season: z.enum(['fall', 'spring', 'summer']),
});

// Pagination validation
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Validate and parse data with helpful error messages
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string[]> } {
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });
      return { success: false, errors };
    }
    throw error;
  }
}

// Email validation helpers
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isAcademicEmail(email: string): boolean {
  const academicDomains = ['.edu', '.ac.uk', '.edu.au', '.ac.jp', '.edu.cn'];
  return academicDomains.some(domain => email.toLowerCase().endsWith(domain));
}

// Course number validation helpers
export function isValidCourseNumber(courseNumber: string): boolean {
  // CSE course numbers: 131, 417T, etc.
  const pattern = /^\d+[A-Z]?$/;
  
  return pattern.test(courseNumber);
}

// Date validation helpers
export function isValidYear(year: number): boolean {
  const currentYear = new Date().getFullYear();
  return year >= currentYear - 10 && year <= currentYear + 5;
}

export function isFutureDate(date: Date): boolean {
  return date.getTime() > Date.now();
}

export function isPastDate(date: Date): boolean {
  return date.getTime() < Date.now();
}

// URL validation helpers
export function isValidLinkedInUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'www.linkedin.com' || urlObj.hostname === 'linkedin.com';
  } catch {
    return false;
  }
}

// Password validation helpers
export function isStrongPassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}