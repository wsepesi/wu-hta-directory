import { Resend } from 'resend';
import { 
  getInvitationEmailTemplate, 
  getTargetedInvitationEmailTemplate,
  getPasswordResetEmailTemplate,
  getWelcomeEmailTemplate,
  getTAAssignmentNotificationTemplate,
  getHistoricalHeadTARecordTemplate,
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
  targetedForTA?: boolean;
  courseOfferingId?: string;
  personalMessage?: string;
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

export interface ClaimProfileEmailData {
  to: string;
  recipientName: string;
  inviterName: string;
  invitationToken: string;
  unclaimedProfileId: string;
  personalMessage?: string;
  expirationDays: number;
}

export interface ClaimProfileInvitationData {
  to: string;
  profileName: string;
  claimUrl: string;
  senderName: string;
}

// Type definition for Resend API response
interface CreateEmailResponse {
  id: string;
  data?: unknown;
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
    }) as unknown as CreateEmailResponse;
    
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
  // If this is a targeted invitation with course info, use the targeted template
  if (data.targetedForTA && data.courseOfferingId) {
    // We need to get course offering details for the targeted email
    // For now, we'll fall back to the regular invitation since we don't have 
    // all the required data (courseNumber, courseName, etc.) in this function
    console.warn('Targeted invitation attempted but missing course details. Using regular invitation.');
  }
  
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
  
  const subject = `Claim Your Head TA Profile for ${data.courseNumber} - ${data.courseName}`;
  
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
  
  const subject = `Claim Your Head TA Profile for ${data.courseNumber}`;
  
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
 * Send a claim profile invitation email
 */
export async function sendClaimProfileEmail(data: ClaimProfileEmailData): Promise<{
  success: boolean;
  error?: string;
}> {
  const invitationUrl = `${APP_URL}/profile/claim?token=${data.invitationToken}&profileId=${data.unclaimedProfileId}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Claim Your WU Head TAs Profile</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { margin-top: 40px; font-size: 14px; color: #666; }
        .message-box { background-color: #e9ecef; padding: 15px; border-radius: 4px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Claim Your WU Head TAs Profile</h1>
        </div>
        
        <p>Hi ${data.recipientName},</p>
        
        <p><strong>${data.inviterName}</strong> has invited you to claim your profile on the WU Head TAs platform.</p>
        
        <p>We've created a profile for you based on your teaching assistant assignments. By claiming this profile, you'll be able to:</p>
        <ul>
          <li>Update your information and add professional details</li>
          <li>Connect with other head TAs</li>
          <li>Showcase your TA experience</li>
          <li>Control your privacy settings</li>
        </ul>
        
        ${data.personalMessage ? `
        <div class="message-box">
          <p><strong>Personal message from ${data.inviterName}:</strong></p>
          <p>${data.personalMessage}</p>
        </div>
        ` : ''}
        
        <a href="${invitationUrl}" class="button">Claim Your Profile</a>
        
        <p><small>Or copy and paste this link: ${invitationUrl}</small></p>
        
        <p>This invitation will expire in ${data.expirationDays} days.</p>
        
        <div class="footer">
          <p>If you believe this email was sent in error or you don't wish to claim this profile, you can safely ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
Claim Your WU Head TAs Profile

Hi ${data.recipientName},

${data.inviterName} has invited you to claim your profile on the WU Head TAs platform.

We've created a profile for you based on your teaching assistant assignments. By claiming this profile, you'll be able to:
- Update your information and add professional details
- Connect with other head TAs
- Showcase your TA experience
- Control your privacy settings

${data.personalMessage ? `Personal message from ${data.inviterName}:\n${data.personalMessage}\n\n` : ''}

Claim your profile: ${invitationUrl}

This invitation will expire in ${data.expirationDays} days.

If you believe this email was sent in error or you don't wish to claim this profile, you can safely ignore this email.
  `;
  
  const subject = 'Claim Your WU Head TAs Profile';
  
  return sendEmail({
    to: data.to,
    subject,
    html,
    text,
  });
}

/**
 * Send historical Head TA record notification
 */
export async function sendHistoricalHeadTARecordNotification(data: {
  to: string;
  recipientName: string;
  courseNumber: string;
  courseName: string;
  semester: string;
  professorName: string | null;
  claimToken: string;
}): Promise<{
  success: boolean;
  error?: string;
}> {
  const claimUrl = `${APP_URL}/profile/claim?token=${data.claimToken}`;
  
  const { html, text } = getHistoricalHeadTARecordTemplate({
    recipientName: data.recipientName,
    courseNumber: data.courseNumber,
    courseName: data.courseName,
    semester: data.semester,
    professorName: data.professorName,
    claimUrl,
  });
  
  const subject = `You've been recorded as a Head TA for ${data.courseNumber}`;
  
  return sendEmail({
    to: data.to,
    subject,
    html,
    text,
  });
}

/**
 * Send claim profile invitation (simple version)
 */
export async function sendClaimProfileInvitation(data: ClaimProfileInvitationData): Promise<{
  success: boolean;
  error?: string;
}> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Claim Your WU Head TAs Profile</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { margin-top: 40px; font-size: 14px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Claim Your WU Head TAs Profile</h1>
        </div>
        
        <p>Hi ${data.profileName},</p>
        
        <p><strong>${data.senderName}</strong> has invited you to claim your profile on the WU Head TAs platform.</p>
        
        <p>We have a profile for you based on your teaching assistant records. By claiming this profile, you'll be able to:</p>
        <ul>
          <li>Update your information and add professional details</li>
          <li>Connect with other head TAs</li>
          <li>Showcase your TA experience</li>
          <li>Control your privacy settings</li>
        </ul>
        
        <a href="${data.claimUrl}" class="button">Claim Your Profile</a>
        
        <p><small>Or copy and paste this link: ${data.claimUrl}</small></p>
        
        <p>This invitation will expire in 30 days.</p>
        
        <div class="footer">
          <p>If you believe this email was sent in error or you don't wish to claim this profile, you can safely ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
Claim Your WU Head TAs Profile

Hi ${data.profileName},

${data.senderName} has invited you to claim your profile on the WU Head TAs platform.

We have a profile for you based on your teaching assistant records. By claiming this profile, you'll be able to:
- Update your information and add professional details
- Connect with other head TAs
- Showcase your TA experience
- Control your privacy settings

Claim your profile: ${data.claimUrl}

This invitation will expire in 30 days.

If you believe this email was sent in error or you don't wish to claim this profile, you can safely ignore this email.
  `;
  
  const subject = 'Claim Your WU Head TAs Profile';
  
  return sendEmail({
    to: data.to,
    subject,
    html,
    text,
  });
}

/**
 * Validate email configuration
 */
export function isEmailConfigured(): boolean {
  return !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}