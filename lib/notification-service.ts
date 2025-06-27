import { sendEmail } from './email-service';
import { db } from './db';
import { users, courses, courseOfferings, professors } from './db/schema';
import { eq, sql } from 'drizzle-orm';

interface ProfileClaimNotification {
  taId: string;
  courseOfferingId: string;
  hoursPerWeek: number;
  assignedBy: string;
}

interface RecordUpdateNotification {
  taId: string;
  courseOfferingId: string;
  updatedBy: string;
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
  details?: Record<string, unknown>;
}

interface TARemovalNotification {
  taId: string;
  courseOfferingId: string;
  removedBy: string;
}

interface TAAssignmentNotification {
  taId: string;
  courseOfferingId: string;
  hoursPerWeek: number;
  assignedBy: string;
}

export class NotificationService {
  /**
   * Send notification when a TA profile is available to claim
   */
  async notifyProfileClaimAvailable(data: ProfileClaimNotification): Promise<void> {
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
        <h2>You've been recorded as a Head TA - claim your profile!</h2>
        <p>Hi ${ta[0].firstName},</p>
        <p>You have been recorded as a Head TA for the following course. Claim your profile to manage your information:</p>
        <ul>
          <li><strong>Course:</strong> ${offering.courseNumber}: ${offering.courseName}</li>
          <li><strong>Semester:</strong> ${offering.semester}</li>
          <li><strong>Professor:</strong> ${professorName}</li>
          <li><strong>Hours per week:</strong> ${data.hoursPerWeek}</li>
        </ul>
        <p>Please claim your profile in the Head TA Directory to:</p>
        <ul>
          <li>Update your professional information</li>
          <li>Control your privacy settings</li>
          <li>Connect with other Head TAs</li>
          <li>Showcase your teaching experience</li>
        </ul>
        <p>If you believe this record is incorrect, please contact the administrator.</p>
      `;

      await sendEmail({
        to: ta[0].email,
        subject: `Claim Your Head TA Profile for ${offering.courseNumber} - ${offering.semester}`,
        html: emailContent,
      });

      console.log(`Profile claim notification sent to ${ta[0].email}`);
    } catch (error) {
      console.error('Failed to send profile claim notification:', error);
    }
  }

  /**
   * Send notification when a TA record is updated
   */
  async notifyRecordUpdate(data: RecordUpdateNotification): Promise<void> {
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
        <h2>Head TA Record Updated</h2>
        <p>Hi ${ta[0].firstName},</p>
        <p>Your Head TA record has been updated for the following course:</p>
        <ul>
          <li><strong>Course:</strong> ${offering.courseNumber}: ${offering.courseName}</li>
          <li><strong>Semester:</strong> ${offering.semester}</li>
        </ul>
        <p>If you believe this is an error or have questions, please contact the administrator.</p>
      `;

      await sendEmail({
        to: ta[0].email,
        subject: `Head TA Record Updated: ${offering.courseNumber} - ${offering.semester}`,
        html: emailContent,
      });

      console.log(`Record update notification sent to ${ta[0].email}`);
    } catch (error) {
      console.error('Failed to send record update notification:', error);
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

      const emailContent = `
        <h2>Course Missing Head TA</h2>
        <p>The following course has been without a Head TA for <strong>${data.daysSinceCreated} days</strong>:</p>
        <ul>
          <li><strong>Course:</strong> ${offering.courseNumber}: ${offering.courseName}</li>
          <li><strong>Semester:</strong> ${offering.semester}</li>
          <li><strong>Professor:</strong> ${professorName}</li>
        </ul>
        <p>Please take action to:</p>
        <ol>
          <li>Record a Head TA for this course</li>
          <li>Send invitations to claim profiles</li>
          <li>Contact the professor to discuss TA requirements</li>
        </ol>
        <p><a href="${process.env.NEXTAUTH_URL}/dashboard/missing-records">View Missing TAs Dashboard</a></p>
      `;

      // Send to all admin emails
      await Promise.all(
        adminEmails.map(email =>
          sendEmail({
            to: email,
            subject: `${offering.courseNumber} needs a Head TA`,
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
   * Notify TA when they are removed from a course assignment
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

      // Get remover details (admin who removed the assignment)
      const remover = await db
        .select()
        .from(users)
        .where(eq(users.id, data.removedBy))
        .limit(1);

      const removerName = remover[0] 
        ? `${remover[0].firstName} ${remover[0].lastName}`
        : 'Administrator';

      const emailContent = `
        <h2>TA Assignment Removed</h2>
        <p>Hi ${ta[0].firstName},</p>
        <p>Your Head TA assignment has been removed from the following course:</p>
        <ul>
          <li><strong>Course:</strong> ${offering.courseNumber}: ${offering.courseName}</li>
          <li><strong>Semester:</strong> ${offering.semester}</li>
          <li><strong>Professor:</strong> ${professorName}</li>
        </ul>
        <p>This change was made by: ${removerName}</p>
        <p>If you believe this is an error or have questions about this change, please contact the administrator.</p>
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
   * Notify TA when they are assigned to a course
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

      // Get assigner details (admin who created the assignment)
      const assigner = await db
        .select()
        .from(users)
        .where(eq(users.id, data.assignedBy))
        .limit(1);

      const assignerName = assigner[0] 
        ? `${assigner[0].firstName} ${assigner[0].lastName}`
        : 'Administrator';

      const emailContent = `
        <h2>You've been assigned as a Head TA</h2>
        <p>Hi ${ta[0].firstName},</p>
        <p>You have been assigned as a Head TA for the following course:</p>
        <ul>
          <li><strong>Course:</strong> ${offering.courseNumber}: ${offering.courseName}</li>
          <li><strong>Semester:</strong> ${offering.semester}</li>
          <li><strong>Professor:</strong> ${professorName}</li>
          <li><strong>Hours per week:</strong> ${data.hoursPerWeek}</li>
        </ul>
        <p>This assignment was created by: ${assignerName}</p>
        <p>Please log in to the Head TA Directory to:</p>
        <ul>
          <li>Update your professional information</li>
          <li>Set your privacy preferences</li>
          <li>View your responsibilities and workload</li>
          <li>Connect with other Head TAs</li>
        </ul>
        <p>If you have any questions about this assignment, please contact the administrator.</p>
      `;

      await sendEmail({
        to: ta[0].email,
        subject: `Head TA Assignment: ${offering.courseNumber} - ${offering.semester}`,
        html: emailContent,
      });

      console.log(`TA assignment notification sent to ${ta[0].email}`);
    } catch (error) {
      console.error('Failed to send TA assignment notification:', error);
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

      const emailContent = `
        <h2>Daily Missing TA Report</h2>
        <p>There are currently <strong>${missingAssignments.length} courses</strong> without Head TAs.</p>
        
        <h3>Courses Missing TAs:</h3>
        <table border="1" cellpadding="5" cellspacing="0">
          <thead>
            <tr>
              <th>Course</th>
              <th>Semester</th>
              <th>Days Waiting</th>
            </tr>
          </thead>
          <tbody>
            ${missingAssignments.map(a => {
              const days = Math.floor(
                (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24)
              );
              return `
                <tr>
                  <td>${a.courseNumber}: ${a.courseName}</td>
                  <td>${a.semester}</td>
                  <td>${days}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <p><a href="${process.env.NEXTAUTH_URL}/dashboard/missing-records">View Full Dashboard</a></p>
      `;

      await Promise.all(
        adminEmails.map(email =>
          sendEmail({
            to: email,
            subject: `Daily Report: ${missingAssignments.length} courses need TAs`,
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