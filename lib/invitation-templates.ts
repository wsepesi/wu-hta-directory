interface EmailTemplate {
  html: string;
  text: string;
}

interface InvitationTemplateData {
  inviterName: string;
  invitationUrl: string;
  role: 'head_ta' | 'admin';
  expirationDays: number;
}

interface TargetedInvitationTemplateData {
  recipientName?: string;
  inviterName: string;
  invitationUrl: string;
  courseNumber: string;
  courseName: string;
  semester: string;
  professorName: string | null;
  message?: string;
  expirationDays: number;
}

interface PasswordResetTemplateData {
  userName: string;
  resetUrl: string;
  expirationHours: number;
}

interface WelcomeTemplateData {
  userName: string;
  role: 'head_ta' | 'admin';
  dashboardUrl: string;
}

interface TAAssignmentTemplateData {
  taName: string;
  courseNumber: string;
  courseName: string;
  semester: string;
  professorName: string | null;
  hoursPerWeek: number;
  dashboardUrl: string;
}

/**
 * Get invitation email template
 */
export function getInvitationEmailTemplate(data: InvitationTemplateData): EmailTemplate {
  const roleText = data.role === 'admin' ? 'administrator' : 'head TA';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invitation to WU Head TAs</title>
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
          <h1>You're invited to join WU Head TAs!</h1>
        </div>
        
        <p>Hi there,</p>
        
        <p><strong>${data.inviterName}</strong> has invited you to join the WU Head TAs platform as a ${roleText}.</p>
        
        <p>WU Head TAs is a private platform for managing teaching assistant assignments and connecting with fellow TAs.</p>
        
        <a href="${data.invitationUrl}" class="button">Accept Invitation</a>
        
        <p><small>Or copy and paste this link: ${data.invitationUrl}</small></p>
        
        <p>This invitation will expire in ${data.expirationDays} days.</p>
        
        <div class="footer">
          <p>If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
You're invited to join WU Head TAs!

Hi there,

${data.inviterName} has invited you to join the WU Head TAs platform as a ${roleText}.

WU Head TAs is a private platform for managing teaching assistant assignments and connecting with fellow TAs.

Accept your invitation here: ${data.invitationUrl}

This invitation will expire in ${data.expirationDays} days.

If you didn't expect this invitation, you can safely ignore this email.
  `.trim();
  
  return { html, text };
}

/**
 * Get targeted invitation email template
 */
export function getTargetedInvitationEmailTemplate(data: TargetedInvitationTemplateData): EmailTemplate {
  const greeting = data.recipientName ? `Hi ${data.recipientName},` : 'Hi there,';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>TA Opportunity</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .course-info { background-color: #e9ecef; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 24px; background-color: #28a745; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .message { background-color: #f0f8ff; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .footer { margin-top: 40px; font-size: 14px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Claim Your Head TA Profile for ${data.courseNumber}</h1>
        </div>
        
        <p>${greeting}</p>
        
        <p><strong>${data.inviterName}</strong> has recorded you as the Head TA for this course. Claim your profile to manage your information!</p>
        
        <div class="course-info">
          <h3>Course Details:</h3>
          <p><strong>Course:</strong> ${data.courseNumber} - ${data.courseName}</p>
          <p><strong>Semester:</strong> ${data.semester}</p>
          <p><strong>Instructor:</strong> ${data.professorName || 'TBD'}</p>
        </div>
        
        ${data.message ? `
        <div class="message">
          <p><strong>Message from ${data.inviterName}:</strong></p>
          <p>${data.message}</p>
        </div>
        ` : ''}
        
        <p>Claim your profile on the WU Head TAs platform to update your information and control your privacy settings.</p>
        
        <a href="${data.invitationUrl}" class="button">Join WU Head TAs</a>
        
        <p><small>Or copy and paste this link: ${data.invitationUrl}</small></p>
        
        <p>This invitation will expire in ${data.expirationDays} days.</p>
        
        <div class="footer">
          <p>If you believe this record is incorrect or you don't wish to claim this profile, you can safely ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
Claim Your Head TA Profile for ${data.courseNumber}

${greeting}

${data.inviterName} has recorded you as the Head TA for this course. Claim your profile to manage your information!

Course Details:
- Course: ${data.courseNumber} - ${data.courseName}
- Semester: ${data.semester}
- Instructor: ${data.professorName || 'TBD'}

${data.message ? `Message from ${data.inviterName}:\n${data.message}\n\n` : ''}Claim your profile on the WU Head TAs platform to update your information and control your privacy settings.

Join here: ${data.invitationUrl}

This invitation will expire in ${data.expirationDays} days.

If you believe this record is incorrect or you don't wish to claim this profile, you can safely ignore this email.
  `.trim();
  
  return { html, text };
}

/**
 * Get password reset email template
 */
export function getPasswordResetEmailTemplate(data: PasswordResetTemplateData): EmailTemplate {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Your Password</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { margin-top: 40px; font-size: 14px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Reset Your Password</h1>
        </div>
        
        <p>Hi ${data.userName},</p>
        
        <p>We received a request to reset your password for your WU Head TAs account.</p>
        
        <a href="${data.resetUrl}" class="button">Reset Password</a>
        
        <p><small>Or copy and paste this link: ${data.resetUrl}</small></p>
        
        <p>This link will expire in ${data.expirationHours} hours.</p>
        
        <p>If you didn't request a password reset, please ignore this email. Your password won't be changed.</p>
        
        <div class="footer">
          <p>For security reasons, this link will only work once.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
Reset Your Password

Hi ${data.userName},

We received a request to reset your password for your WU Head TAs account.

Reset your password here: ${data.resetUrl}

This link will expire in ${data.expirationHours} hours.

If you didn't request a password reset, please ignore this email. Your password won't be changed.

For security reasons, this link will only work once.
  `.trim();
  
  return { html, text };
}

/**
 * Get welcome email template
 */
export function getWelcomeEmailTemplate(data: WelcomeTemplateData): EmailTemplate {
  const roleText = data.role === 'admin' ? 'administrator' : 'head TA';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to WU Head TAs!</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .features { background-color: #e9ecef; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .footer { margin-top: 40px; font-size: 14px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to WU Head TAs!</h1>
        </div>
        
        <p>Hi ${data.userName},</p>
        
        <p>Welcome to the WU Head TAs platform! Your account has been successfully created as a ${roleText}.</p>
        
        <div class="features">
          <h3>What you can do:</h3>
          <ul>
            <li>View and manage TA assignments</li>
            <li>Connect with other head TAs</li>
            <li>Access the public directory</li>
            ${data.role === 'admin' ? '<li>Manage courses and professors</li><li>View system statistics</li>' : ''}
            <li>Invite new members to the platform</li>
          </ul>
        </div>
        
        <a href="${data.dashboardUrl}" class="button">Go to Dashboard</a>
        
        <p>If you have any questions, feel free to reach out to an administrator.</p>
        
        <div class="footer">
          <p>Thank you for joining WU Head TAs!</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
Welcome to WU Head TAs!

Hi ${data.userName},

Welcome to the WU Head TAs platform! Your account has been successfully created as a ${roleText}.

What you can do:
- View and manage TA assignments
- Connect with other head TAs
- Access the public directory
${data.role === 'admin' ? '- Manage courses and professors\n- View system statistics' : ''}
- Invite new members to the platform

Go to your dashboard: ${data.dashboardUrl}

If you have any questions, feel free to reach out to an administrator.

Thank you for joining WU Head TAs!
  `.trim();
  
  return { html, text };
}

/**
 * Get TA assignment notification template
 */
export function getTAAssignmentNotificationTemplate(data: TAAssignmentTemplateData): EmailTemplate {
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New TA Assignment</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .assignment-info { background-color: #e9ecef; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 24px; background-color: #28a745; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { margin-top: 40px; font-size: 14px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>You've been recorded as a Head TA!</h1>
        </div>
        
        <p>Hi ${data.taName},</p>
        
        <p>You've been recorded as the Head TA for the following course. Claim your profile to manage your information:</p>
        
        <div class="assignment-info">
          <h3>Head TA Record Details:</h3>
          <p><strong>Course:</strong> ${data.courseNumber} - ${data.courseName}</p>
          <p><strong>Semester:</strong> ${data.semester}</p>
          <p><strong>Instructor:</strong> ${data.professorName || 'TBD'}</p>
          <p><strong>Hours per week:</strong> ${data.hoursPerWeek}</p>
        </div>
        
        <p>Please claim your profile to update your information, control privacy settings, and connect with faculty and other TAs.</p>
        
        <a href="${data.dashboardUrl}" class="button">View Assignment</a>
        
        <div class="footer">
          <p>Thank you for your service as a Head TA!</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
You've been recorded as a Head TA!

Hi ${data.taName},

You've been recorded as the Head TA for the following course. Claim your profile to manage your information:

Head TA Record Details:
- Course: ${data.courseNumber} - ${data.courseName}
- Semester: ${data.semester}
- Instructor: ${data.professorName || 'TBD'}
- Hours per week: ${data.hoursPerWeek}

Please claim your profile to update your information, control privacy settings, and connect with faculty and other TAs.

View your assignment: ${data.dashboardUrl}

Thank you for your service as a Head TA!
  `.trim();
  
  return { html, text };
}

/**
 * Get historical Head TA record notification template
 */
export function getHistoricalHeadTARecordTemplate(data: {
  recipientName: string;
  courseNumber: string;
  courseName: string;
  semester: string;
  professorName: string | null;
  claimUrl: string;
}): EmailTemplate {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>You've Been Recorded as a Head TA</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .course-info { background-color: #e9ecef; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .benefits { background-color: #f0f8ff; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .footer { margin-top: 40px; font-size: 14px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>You've Been Recorded as a Head TA</h1>
        </div>
        
        <p>Hi ${data.recipientName},</p>
        
        <p>We're building a comprehensive directory of Head TAs at Washington University, and you've been recorded as having served in this role:</p>
        
        <div class="course-info">
          <h3>Your Head TA Record:</h3>
          <p><strong>Course:</strong> ${data.courseNumber} - ${data.courseName}</p>
          <p><strong>Semester:</strong> ${data.semester}</p>
          <p><strong>Professor:</strong> ${data.professorName || 'Not specified'}</p>
        </div>
        
        <div class="benefits">
          <h3>By claiming your profile, you can:</h3>
          <ul>
            <li>Update your professional information and bio</li>
            <li>Add other courses you've TA'd</li>
            <li>Control your privacy settings</li>
            <li>Connect with current and former Head TAs</li>
            <li>Be part of the WU CS Head TA community</li>
          </ul>
        </div>
        
        <p>This is a one-time opportunity to claim and manage your profile in our directory.</p>
        
        <a href="${data.claimUrl}" class="button">Claim Your Profile</a>
        
        <div class="footer">
          <p>If you believe this information is incorrect or you prefer not to be listed, you can ignore this email or contact us to have your record removed.</p>
          <p>Thank you for your service to the WU CS community!</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
You've Been Recorded as a Head TA

Hi ${data.recipientName},

We're building a comprehensive directory of Head TAs at Washington University, and you've been recorded as having served in this role:

Your Head TA Record:
- Course: ${data.courseNumber} - ${data.courseName}
- Semester: ${data.semester}
- Professor: ${data.professorName || 'Not specified'}

By claiming your profile, you can:
- Update your professional information and bio
- Add other courses you've TA'd
- Control your privacy settings
- Connect with current and former Head TAs
- Be part of the WU CS Head TA community

This is a one-time opportunity to claim and manage your profile in our directory.

Claim your profile: ${data.claimUrl}

If you believe this information is incorrect or you prefer not to be listed, you can ignore this email or contact us to have your record removed.

Thank you for your service to the WU CS community!
  `.trim();
  
  return { html, text };
}