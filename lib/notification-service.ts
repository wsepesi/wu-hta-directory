import { sendEmail } from './email-service';
import { db } from './db';
import { users, courses, courseOfferings, professors } from './db/schema';
import { eq } from 'drizzle-orm';

interface TAAssignmentNotification {
  taId: string;
  courseOfferingId: string;
  hoursPerWeek: number;
  assignedBy: string;
}

interface TARemovalNotification {
  taId: string;
  courseOfferingId: string;
  removedBy: string;
}

interface MissingTANotification {
  courseOfferingId: string;
  daysSinceCreated: number;
  adminIds: string[];
}

interface CourseUpdateNotification {
  courseOfferingId: string;
  changeType: 'professor_changed' | 'schedule_changed' | 'deleted';
  taIds: string[];
  details?: any;
}

export class NotificationService {
  /**
   * Send notification when a TA is assigned to a course
   */
  async notifyTAAssignment(data: TAAssignmentNotification): Promise<void> {
    try {
      // Get TA details
      const ta = await db
        .select()
        .from(users)
        .where(eq(users.id, data.taId))
        .limit(1);

      if (!ta[0] || !ta[0].email) {
        console.error('TA not found or has no email');
        return;
      }

      // Get course offering details
      const offeringDetails = await db
        .select({
          courseNumber: courses.courseNumber,
          courseName: courses.courseName,
          semester: courseOfferings.semester,
          professorFirstName: professors.firstName,
          professorLastName: professors.lastName,
        })
        .from(courseOfferings)
        .innerJoin(courses, eq(courseOfferings.courseId, courses.id))
        .leftJoin(professors, eq(courseOfferings.professorId, professors.id))
        .where(eq(courseOfferings.id, data.courseOfferingId))
        .limit(1);

      if (!offeringDetails[0]) {
        console.error('Course offering not found');
        return;
      }

      const offering = offeringDetails[0];
      const professorName = offering.professorFirstName && offering.professorLastName
        ? `${offering.professorFirstName} ${offering.professorLastName}`
        : 'TBD';

      const emailContent = `
        <h2>You've been assigned as a Head TA!</h2>
        <p>Hi ${ta[0].firstName},</p>
        <p>You have been assigned as a Head TA for the following course:</p>
        <ul>
          <li><strong>Course:</strong> ${offering.courseNumber}: ${offering.courseName}</li>
          <li><strong>Semester:</strong> ${offering.semester}</li>
          <li><strong>Professor:</strong> ${professorName}</li>
          <li><strong>Hours per week:</strong> ${data.hoursPerWeek}</li>
        </ul>
        <p>Please log in to the Head TA Directory to view more details and manage your assignments.</p>
        <p>If you have any questions or concerns about this assignment, please contact the administrator.</p>
      `;

      await sendEmail({
        to: ta[0].email,
        subject: `TA Assignment: ${offering.courseNumber} - ${offering.semester}`,
        html: emailContent,
      });

      console.log(`TA assignment notification sent to ${ta[0].email}`);
    } catch (error) {
      console.error('Failed to send TA assignment notification:', error);
    }
  }

  /**
   * Send notification when a TA is removed from a course
   */
  async notifyTARemoval(data: TARemovalNotification): Promise<void> {
    try {
      // Get TA details
      const ta = await db
        .select()
        .from(users)
        .where(eq(users.id, data.taId))
        .limit(1);

      if (!ta[0] || !ta[0].email) {
        console.error('TA not found or has no email');
        return;
      }

      // Get course offering details
      const offeringDetails = await db
        .select({
          courseNumber: courses.courseNumber,
          courseName: courses.courseName,
          semester: courseOfferings.semester,
        })
        .from(courseOfferings)
        .innerJoin(courses, eq(courseOfferings.courseId, courses.id))
        .where(eq(courseOfferings.id, data.courseOfferingId))
        .limit(1);

      if (!offeringDetails[0]) {
        console.error('Course offering not found');
        return;
      }

      const offering = offeringDetails[0];

      const emailContent = `
        <h2>TA Assignment Removed</h2>
        <p>Hi ${ta[0].firstName},</p>
        <p>Your Head TA assignment has been removed for the following course:</p>
        <ul>
          <li><strong>Course:</strong> ${offering.courseNumber}: ${offering.courseName}</li>
          <li><strong>Semester:</strong> ${offering.semester}</li>
        </ul>
        <p>If you believe this is an error or have questions, please contact the administrator.</p>
      `;

      await sendEmail({
        to: ta[0].email,
        subject: `TA Assignment Removed: ${offering.courseNumber} - ${offering.semester}`,
        html: emailContent,
      });

      console.log(`TA removal notification sent to ${ta[0].email}`);
    } catch (error) {
      console.error('Failed to send TA removal notification:', error);
    }
  }

  /**
   * Notify admins about courses missing TAs
   */
  async notifyMissingTAs(data: MissingTANotification): Promise<void> {
    try {
      // Get admin users
      const admins = await db
        .select()
        .from(users)
        .where(eq(users.role, 'admin'));

      const adminEmails = admins
        .filter(admin => admin.email && data.adminIds.includes(admin.id))
        .map(admin => admin.email!);

      if (adminEmails.length === 0) {
        console.error('No admin emails found');
        return;
      }

      // Get course offering details
      const offeringDetails = await db
        .select({
          courseNumber: courses.courseNumber,
          courseName: courses.courseName,
          semester: courseOfferings.semester,
          professorFirstName: professors.firstName,
          professorLastName: professors.lastName,
        })
        .from(courseOfferings)
        .innerJoin(courses, eq(courseOfferings.courseId, courses.id))
        .leftJoin(professors, eq(courseOfferings.professorId, professors.id))
        .where(eq(courseOfferings.id, data.courseOfferingId))
        .limit(1);

      if (!offeringDetails[0]) {
        console.error('Course offering not found');
        return;
      }

      const offering = offeringDetails[0];
      const professorName = offering.professorFirstName && offering.professorLastName
        ? `${offering.professorFirstName} ${offering.professorLastName}`
        : 'Not assigned';

      const urgencyLevel = data.daysSinceCreated > 14 ? 'URGENT' : 
                          data.daysSinceCreated > 7 ? 'High Priority' : 'New';

      const emailContent = `
        <h2>${urgencyLevel}: Course Missing Head TA</h2>
        <p>The following course has been without a Head TA for <strong>${data.daysSinceCreated} days</strong>:</p>
        <ul>
          <li><strong>Course:</strong> ${offering.courseNumber}: ${offering.courseName}</li>
          <li><strong>Semester:</strong> ${offering.semester}</li>
          <li><strong>Professor:</strong> ${professorName}</li>
        </ul>
        <p>Please take action to:</p>
        <ol>
          <li>Assign an existing Head TA to this course</li>
          <li>Send targeted invitations to potential TAs</li>
          <li>Contact the professor to discuss TA requirements</li>
        </ol>
        <p><a href="${process.env.NEXTAUTH_URL}/dashboard/missing-tas">View Missing TAs Dashboard</a></p>
      `;

      // Send to all admin emails
      await Promise.all(
        adminEmails.map(email =>
          sendEmail({
            to: email,
            subject: `${urgencyLevel}: ${offering.courseNumber} needs a Head TA`,
            html: emailContent,
          })
        )
      );

      console.log(`Missing TA notifications sent to ${adminEmails.length} admins`);
    } catch (error) {
      console.error('Failed to send missing TA notification:', error);
    }
  }

  /**
   * Notify TAs when course details change
   */
  async notifyCourseUpdate(data: CourseUpdateNotification): Promise<void> {
    try {
      // Get TAs
      const tas = await db
        .select()
        .from(users)
        .where(eq(users.role, 'head_ta'));

      const taEmails = tas
        .filter(ta => ta.email && data.taIds.includes(ta.id))
        .map(ta => ({ email: ta.email!, firstName: ta.firstName }));

      if (taEmails.length === 0) {
        console.error('No TA emails found');
        return;
      }

      // Get course offering details
      const offeringDetails = await db
        .select({
          courseNumber: courses.courseNumber,
          courseName: courses.courseName,
          semester: courseOfferings.semester,
        })
        .from(courseOfferings)
        .innerJoin(courses, eq(courseOfferings.courseId, courses.id))
        .where(eq(courseOfferings.id, data.courseOfferingId))
        .limit(1);

      if (!offeringDetails[0]) {
        console.error('Course offering not found');
        return;
      }

      const offering = offeringDetails[0];

      let emailContent = '';
      let subject = '';

      switch (data.changeType) {
        case 'professor_changed':
          subject = `Professor Change: ${offering.courseNumber} - ${offering.semester}`;
          emailContent = `
            <h2>Course Professor Changed</h2>
            <p>Hi {firstName},</p>
            <p>The professor for your assigned course has changed:</p>
            <ul>
              <li><strong>Course:</strong> ${offering.courseNumber}: ${offering.courseName}</li>
              <li><strong>Semester:</strong> ${offering.semester}</li>
              <li><strong>New Professor:</strong> ${data.details?.newProfessor || 'TBD'}</li>
            </ul>
            <p>Please check the Head TA Directory for updated information.</p>
          `;
          break;

        case 'schedule_changed':
          subject = `Schedule Change: ${offering.courseNumber} - ${offering.semester}`;
          emailContent = `
            <h2>Course Schedule Changed</h2>
            <p>Hi {firstName},</p>
            <p>The schedule for your assigned course has changed:</p>
            <ul>
              <li><strong>Course:</strong> ${offering.courseNumber}: ${offering.courseName}</li>
              <li><strong>New Semester:</strong> ${data.details?.newSemester || offering.semester}</li>
            </ul>
            <p>Please review your availability and contact the administrator if needed.</p>
          `;
          break;

        case 'deleted':
          subject = `Course Cancelled: ${offering.courseNumber} - ${offering.semester}`;
          emailContent = `
            <h2>Course Offering Cancelled</h2>
            <p>Hi {firstName},</p>
            <p>The following course offering has been cancelled:</p>
            <ul>
              <li><strong>Course:</strong> ${offering.courseNumber}: ${offering.courseName}</li>
              <li><strong>Semester:</strong> ${offering.semester}</li>
            </ul>
            <p>Your TA assignment has been removed. Please contact the administrator if you have questions.</p>
          `;
          break;
      }

      // Send personalized emails
      await Promise.all(
        taEmails.map(ta =>
          sendEmail({
            to: ta.email,
            subject,
            html: emailContent.replace('{firstName}', ta.firstName),
          })
        )
      );

      console.log(`Course update notifications sent to ${taEmails.length} TAs`);
    } catch (error) {
      console.error('Failed to send course update notification:', error);
    }
  }

  /**
   * Send daily digest of missing TAs to admins
   */
  async sendMissingTADigest(): Promise<void> {
    try {
      const missingAssignments = await db
        .select({
          courseNumber: courses.courseNumber,
          courseName: courses.courseName,
          semester: courseOfferings.semester,
          createdAt: courseOfferings.createdAt,
        })
        .from(courseOfferings)
        .innerJoin(courses, eq(courseOfferings.courseId, courses.id))
        .leftJoin(sql`ta_assignments`, sql`course_offerings.id = ta_assignments.course_offering_id`)
        .where(sql`ta_assignments.id IS NULL`)
        .groupBy(
          courseOfferings.id,
          courses.courseNumber,
          courses.courseName,
          courseOfferings.semester,
          courseOfferings.createdAt
        );

      if (missingAssignments.length === 0) {
        return;
      }

      // Get all admins
      const admins = await db
        .select()
        .from(users)
        .where(eq(users.role, 'admin'));

      const adminEmails = admins
        .filter(admin => admin.email)
        .map(admin => admin.email!);

      if (adminEmails.length === 0) {
        return;
      }

      const urgentCount = missingAssignments.filter(a => {
        const days = Math.floor(
          (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        return days > 14;
      }).length;

      const emailContent = `
        <h2>Daily Missing TA Report</h2>
        <p>There are currently <strong>${missingAssignments.length} courses</strong> without Head TAs.</p>
        ${urgentCount > 0 ? `<p class="urgent">⚠️ ${urgentCount} courses have been waiting for more than 14 days!</p>` : ''}
        
        <h3>Courses Missing TAs:</h3>
        <table border="1" cellpadding="5" cellspacing="0">
          <thead>
            <tr>
              <th>Course</th>
              <th>Semester</th>
              <th>Days Waiting</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${missingAssignments.map(a => {
              const days = Math.floor(
                (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24)
              );
              const status = days > 14 ? 'URGENT' : days > 7 ? 'High' : 'Normal';
              return `
                <tr>
                  <td>${a.courseNumber}: ${a.courseName}</td>
                  <td>${a.semester}</td>
                  <td>${days}</td>
                  <td>${status}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <p><a href="${process.env.NEXTAUTH_URL}/dashboard/missing-tas">View Full Dashboard</a></p>
      `;

      await Promise.all(
        adminEmails.map(email =>
          sendEmail({
            to: email,
            subject: `Daily Report: ${missingAssignments.length} courses need TAs${urgentCount > 0 ? ' (URGENT)' : ''}`,
            html: emailContent,
          })
        )
      );

      console.log(`Daily digest sent to ${adminEmails.length} admins`);
    } catch (error) {
      console.error('Failed to send daily digest:', error);
    }
  }
}

export const notificationService = new NotificationService();