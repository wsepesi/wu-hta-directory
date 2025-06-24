// Core interfaces for the Head TA Directory

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  gradYear?: number;
  degreeProgram?: string;
  currentRole?: string;
  linkedinUrl?: string;
  personalSite?: string;
  location?: string;
  role: 'head_ta' | 'admin';
  invitedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Course {
  id: string;
  courseNumber: string;
  courseName: string;
  offeringPattern: 'both' | 'fall_only' | 'spring_only' | 'sparse';
  createdAt: Date;
}

export interface CourseOffering {
  id: string;
  courseId: string;
  professorId?: string;
  semester: string;
  year: number;
  season: 'Fall' | 'Spring';
  updatedBy?: string;
  createdAt: Date;
}

export interface TAAssignment {
  id: string;
  userId: string;
  courseOfferingId: string;
  hoursPerWeek?: number;
  responsibilities?: string;
  createdAt: Date;
}

export interface Professor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: Date;
}

export interface Invitation {
  id: string;
  email: string;
  invitedBy?: string;
  token: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}

export interface Session {
  id: string;
  sessionToken: string;
  userId: string;
  expires: Date;
  createdAt: Date;
}

// Extended types with relations
export interface UserWithRelations extends User {
  inviter?: User;
  taAssignments?: TAAssignmentWithRelations[];
}

export interface CourseWithRelations extends Course {
  offerings?: CourseOfferingWithRelations[];
}

export interface CourseOfferingWithRelations extends CourseOffering {
  course?: Course;
  professor?: Professor;
  taAssignments?: TAAssignmentWithRelations[];
}

export interface TAAssignmentWithRelations extends TAAssignment {
  user?: User;
  courseOffering?: CourseOfferingWithRelations;
}

export interface InvitationWithRelations extends Invitation {
  inviter?: User;
}

// Input types for creating/updating entities
export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  gradYear?: number;
  degreeProgram?: string;
  currentRole?: string;
  linkedinUrl?: string;
  personalSite?: string;
  location?: string;
  role?: 'head_ta' | 'admin';
  invitedBy?: string;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  gradYear?: number;
  degreeProgram?: string;
  currentRole?: string;
  linkedinUrl?: string;
  personalSite?: string;
  location?: string;
  role?: 'head_ta' | 'admin';
}

export interface CreateCourseInput {
  courseNumber: string;
  courseName: string;
  offeringPattern: 'both' | 'fall_only' | 'spring_only' | 'sparse';
}

export interface CreateCourseOfferingInput {
  courseId: string;
  professorId?: string;
  semester: string;
  year: number;
  season: 'Fall' | 'Spring';
}

export interface CreateTAAssignmentInput {
  userId: string;
  courseOfferingId: string;
  hoursPerWeek?: number;
  responsibilities?: string;
}

export interface CreateProfessorInput {
  firstName: string;
  lastName: string;
  email: string;
}

export interface CreateInvitationInput {
  email: string;
  invitedBy?: string;
}

// Search and filter types
export interface UserFilters {
  gradYear?: number;
  location?: string;
  degreeProgram?: string;
}

export interface CourseFilters {
  offeringPattern?: 'both' | 'fall_only' | 'spring_only' | 'sparse';
}

export interface TAAssignmentFilters {
  userId?: string;
  courseOfferingId?: string;
  semester?: string;
}

// Admin types
export interface UserWithInviter extends User {
  inviter?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  totalProfessors: number;
  totalAssignments: number;
  pendingInvitations: number;
  usersByGradYear: Record<number, number>;
  usersByLocation: Record<string, number>;
}

export interface InvitationTree {
  user: User;
  invitees: InvitationTree[];
}

// Public directory types
export interface PublicDirectoryEntry {
  id: string;
  firstName: string;
  lastName: string;
  gradYear?: number;
  location?: string;
  currentRole?: string;
  courses: {
    courseNumber: string;
    courseName: string;
    semester: string;
    professor?: string;
  }[];
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Validation result type
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}