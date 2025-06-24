import { pgTable, serial, text, varchar, integer, timestamp, boolean, uuid, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  gradYear: integer('grad_year'),
  degreeProgram: varchar('degree_program', { length: 255 }),
  currentRole: varchar('current_role', { length: 255 }),
  linkedinUrl: text('linkedin_url'),
  personalSite: text('personal_site'),
  location: varchar('location', { length: 255 }),
  role: varchar('role', { length: 50 }).notNull().default('head_ta'),
  invitedBy: uuid('invited_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Courses table
export const courses = pgTable('courses', {
  id: uuid('id').defaultRandom().primaryKey(),
  courseNumber: varchar('course_number', { length: 20 }).notNull().unique(),
  courseName: varchar('course_name', { length: 255 }).notNull(),
  offeringPattern: varchar('offering_pattern', { length: 20 }).notNull().default('both'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Professors table
export const professors = pgTable('professors', {
  id: uuid('id').defaultRandom().primaryKey(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Course Offerings table
export const courseOfferings = pgTable('course_offerings', {
  id: uuid('id').defaultRandom().primaryKey(),
  courseId: uuid('course_id').notNull().references(() => courses.id),
  professorId: uuid('professor_id').references(() => professors.id),
  semester: varchar('semester', { length: 50 }).notNull(),
  year: integer('year').notNull(),
  season: varchar('season', { length: 10 }).notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// TA Assignments table
export const taAssignments = pgTable('ta_assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  courseOfferingId: uuid('course_offering_id').notNull().references(() => courseOfferings.id),
  hoursPerWeek: integer('hours_per_week'),
  responsibilities: text('responsibilities'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Invitations table
export const invitations = pgTable('invitations', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  invitedBy: uuid('invited_by').references(() => users.id),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Sessions table for NextAuth
export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
  userId: uuid('user_id').notNull().references(() => users.id),
  expires: timestamp('expires').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Password Reset Tokens table
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  userId: uuid('user_id').notNull().references(() => users.id),
  expires: timestamp('expires').notNull(),
  used: boolean('used').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Audit Logs table for admin activity tracking
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id'),
  metadata: text('metadata'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// User Privacy Settings table
export const userPrivacySettings = pgTable('user_privacy_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id).unique(),
  showEmail: boolean('show_email').notNull().default(false),
  showGradYear: boolean('show_grad_year').notNull().default(true),
  showLocation: boolean('show_location').notNull().default(true),
  showLinkedIn: boolean('show_linkedin').notNull().default(true),
  showPersonalSite: boolean('show_personal_site').notNull().default(true),
  showCourses: boolean('show_courses').notNull().default(true),
  appearInDirectory: boolean('appear_in_directory').notNull().default(true),
  allowContact: boolean('allow_contact').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  taAssignments: many(taAssignments),
  invitationsSent: many(invitations),
  inviter: one(users, {
    fields: [users.invitedBy],
    references: [users.id],
  }),
  invitees: many(users),
  sessions: many(sessions),
  passwordResetTokens: many(passwordResetTokens),
  auditLogs: many(auditLogs),
  privacySettings: one(userPrivacySettings, {
    fields: [users.id],
    references: [userPrivacySettings.userId],
  }),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  offerings: many(courseOfferings),
}));

export const professorsRelations = relations(professors, ({ many }) => ({
  courseOfferings: many(courseOfferings),
}));

export const courseOfferingsRelations = relations(courseOfferings, ({ one, many }) => ({
  course: one(courses, {
    fields: [courseOfferings.courseId],
    references: [courses.id],
  }),
  professor: one(professors, {
    fields: [courseOfferings.professorId],
    references: [professors.id],
  }),
  taAssignments: many(taAssignments),
  updatedByUser: one(users, {
    fields: [courseOfferings.updatedBy],
    references: [users.id],
  }),
}));

export const taAssignmentsRelations = relations(taAssignments, ({ one }) => ({
  user: one(users, {
    fields: [taAssignments.userId],
    references: [users.id],
  }),
  courseOffering: one(courseOfferings, {
    fields: [taAssignments.courseOfferingId],
    references: [courseOfferings.id],
  }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  inviter: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const userPrivacySettingsRelations = relations(userPrivacySettings, ({ one }) => ({
  user: one(users, {
    fields: [userPrivacySettings.userId],
    references: [users.id],
  }),
}));