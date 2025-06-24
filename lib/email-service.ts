import { Resend } from 'resend';
import { 
  getInvitationEmailTemplate, 
  getTargetedInvitationEmailTemplate,
  getPasswordResetEmailTemplate,
  getWelcomeEmailTemplate,
  getTAAssignmentNotificationTemplate,
} from './invitation-templates';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Default from email
const FROM_EMAIL = process.env.EMAIL_FROM || 'WU Head TAs <noreply@wuheadtas.com>';
const APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface InvitationEmailData {
  to: string;
  inviterName: string;
  invitationToken: string;
  role: 'head_ta' | 'admin';
  expirationDays: number;
}

export interface TargetedInvitationEmailData {
  to: string;
  recipientName?: string;
  inviterName: string;
  invitationToken: string;
  courseNumber: string;
  courseName: string;
  semester: string;
  professorName: string | null;
  message?: string;
  expirationDays: number;
}

export interface PasswordResetEmailData {
  to: string;
  userName: string;
  resetToken: string;
  expirationHours: number;
}

export interface WelcomeEmailData {
  to: string;
  userName: string;
  role: 'head_ta' | 'admin';
}

export interface TAAssignmentEmailData {
  to: string;
  taName: string;
  courseNumber: string;
  courseName: string;
  semester: string;
  professorName: string | null;
  hoursPerWeek: number;
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: EmailOptions): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
    });
    
    return {
      success: true,
      messageId: result.id,
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Send an invitation email
 */
export async function sendInvitationEmail(data: InvitationEmailData): Promise<{
  success: boolean;
  error?: string;
}> {
  const invitationUrl = `${APP_URL}/auth/accept-invitation?token=${data.invitationToken}`;
  
  const { html, text } = getInvitationEmailTemplate({
    inviterName: data.inviterName,
    invitationUrl,
    role: data.role,
    expirationDays: data.expirationDays,
  });
  
  const subject = `You're invited to join WU Head TAs${data.role === 'admin' ? ' as an administrator' : ''}`;
  
  return sendEmail({
    to: data.to,
    subject,
    html,
    text,
  });
}

/**
 * Send a targeted invitation email for a specific course
 */
export async function sendTargetedInvitationEmail(data: TargetedInvitationEmailData): Promise<{
  success: boolean;
  error?: string;
}> {
  const invitationUrl = `${APP_URL}/auth/accept-invitation?token=${data.invitationToken}`;
  
  const { html, text } = getTargetedInvitationEmailTemplate({
    recipientName: data.recipientName,
    inviterName: data.inviterName,
    invitationUrl,
    courseNumber: data.courseNumber,
    courseName: data.courseName,
    semester: data.semester,
    professorName: data.professorName,
    message: data.message,
    expirationDays: data.expirationDays,
  });
  
  const subject = `TA opportunity for ${data.courseNumber} - ${data.courseName}`;
  
  return sendEmail({
    to: data.to,
    subject,
    html,
    text,
  });
}

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail(data: PasswordResetEmailData): Promise<{
  success: boolean;
  error?: string;
}> {
  const resetUrl = `${APP_URL}/auth/reset-password?token=${data.resetToken}`;
  
  const { html, text } = getPasswordResetEmailTemplate({
    userName: data.userName,
    resetUrl,
    expirationHours: data.expirationHours,
  });
  
  const subject = 'Reset your WU Head TAs password';
  
  return sendEmail({
    to: data.to,
    subject,
    html,
    text,
  });
}

/**
 * Send a welcome email to new users
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<{
  success: boolean;
  error?: string;
}> {
  const dashboardUrl = `${APP_URL}/dashboard`;
  
  const { html, text } = getWelcomeEmailTemplate({
    userName: data.userName,
    role: data.role,
    dashboardUrl,
  });
  
  const subject = 'Welcome to WU Head TAs!';
  
  return sendEmail({
    to: data.to,
    subject,
    html,
    text,
  });
}

/**
 * Send a notification when a TA is assigned to a course
 */
export async function sendTAAssignmentNotification(data: TAAssignmentEmailData): Promise<{
  success: boolean;
  error?: string;
}> {
  const dashboardUrl = `${APP_URL}/dashboard`;
  
  const { html, text } = getTAAssignmentNotificationTemplate({
    taName: data.taName,
    courseNumber: data.courseNumber,
    courseName: data.courseName,
    semester: data.semester,
    professorName: data.professorName,
    hoursPerWeek: data.hoursPerWeek,
    dashboardUrl,
  });
  
  const subject = `You've been assigned to ${data.courseNumber}`;
  
  return sendEmail({
    to: data.to,
    subject,
    html,
    text,
  });
}

/**
 * Send bulk emails (with rate limiting)
 */
export async function sendBulkEmails(
  emails: EmailOptions[],
  delayMs: number = 100
): Promise<{
  sent: number;
  failed: number;
  errors: Array<{ email: string; error: string }>;
}> {
  let sent = 0;
  let failed = 0;
  const errors: Array<{ email: string; error: string }> = [];
  
  for (const email of emails) {
    const result = await sendEmail(email);
    
    if (result.success) {
      sent++;
    } else {
      failed++;
      errors.push({
        email: Array.isArray(email.to) ? email.to.join(', ') : email.to,
        error: result.error || 'Unknown error',
      });
    }
    
    // Rate limiting delay
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return { sent, failed, errors };
}

/**
 * Validate email configuration
 */
export function isEmailConfigured(): boolean {
  return !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}