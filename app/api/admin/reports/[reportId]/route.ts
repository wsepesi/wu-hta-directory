import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, courses, professors, taAssignments, invitations, courseOfferings, auditLogs } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { logAuditEvent } from "@/lib/audit-logger";

interface ReportParams {
  params: Promise<{
    reportId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: ReportParams) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const format = request.nextUrl.searchParams.get("format") || "csv";
    const resolvedParams = await params;
    const reportId = resolvedParams.reportId;

    // Log the report generation
    await logAuditEvent({
      userId: session.user.id,
      action: "REPORT_GENERATED",
      entityType: "system",
      metadata: { reportId, format }
    });

    let data: unknown;
    let filename: string;

    switch (reportId) {
      case "user-roster":
        data = await generateUserRoster();
        filename = `user-roster-${new Date().toISOString().split("T")[0]}.${format}`;
        break;

      case "ta-assignments":
        data = await generateTAAssignments();
        filename = `ta-assignments-${new Date().toISOString().split("T")[0]}.${format}`;
        break;

      case "course-coverage":
        data = await generateCourseCoverage();
        filename = `course-coverage-${new Date().toISOString().split("T")[0]}.${format}`;
        break;

      case "invitation-status":
        data = await generateInvitationStatus();
        filename = `invitation-status-${new Date().toISOString().split("T")[0]}.${format}`;
        break;

      case "audit-log":
        data = await generateAuditLog();
        filename = `audit-log-${new Date().toISOString().split("T")[0]}.json`;
        break;

      case "user-activity":
        data = await generateUserActivity();
        filename = `user-activity-${new Date().toISOString().split("T")[0]}.${format}`;
        break;

      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
    }

    // Format the response based on the requested format
    let responseBody: string;
    let contentType: string;

    if (format === "csv" && reportId !== "audit-log") {
      responseBody = convertToCSV(data as Record<string, unknown>[]);
      contentType = "text/csv";
    } else {
      responseBody = JSON.stringify(data, null, 2);
      contentType = "application/json";
    }

    return new NextResponse(responseBody, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

async function generateUserRoster() {
  const userList = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      gradYear: users.gradYear,
      degreeProgram: users.degreeProgram,
      currentRole: users.currentRole,
      location: users.location,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(users.lastName, users.firstName);

  return userList;
}

async function generateTAAssignments() {
  const assignments = await db
    .select({
      userId: users.id,
      userFirstName: users.firstName,
      userLastName: users.lastName,
      userEmail: users.email,
      courseNumber: courses.courseNumber,
      courseName: courses.courseName,
      semester: courseOfferings.semester,
      year: courseOfferings.year,
      professorFirstName: professors.firstName,
      professorLastName: professors.lastName,
      hoursPerWeek: taAssignments.hoursPerWeek,
      createdAt: taAssignments.createdAt,
    })
    .from(taAssignments)
    .innerJoin(users, eq(taAssignments.userId, users.id))
    .innerJoin(courseOfferings, eq(taAssignments.courseOfferingId, courseOfferings.id))
    .innerJoin(courses, eq(courseOfferings.courseId, courses.id))
    .leftJoin(professors, eq(courseOfferings.professorId, professors.id))
    .orderBy(desc(courseOfferings.year), desc(courseOfferings.season));

  return assignments;
}

async function generateCourseCoverage() {
  // Get all course offerings
  const offerings = await db
    .select({
      courseId: courses.id,
      courseNumber: courses.courseNumber,
      courseName: courses.courseName,
      offeringId: courseOfferings.id,
      semester: courseOfferings.semester,
      year: courseOfferings.year,
      professorFirstName: professors.firstName,
      professorLastName: professors.lastName,
    })
    .from(courseOfferings)
    .innerJoin(courses, eq(courseOfferings.courseId, courses.id))
    .leftJoin(professors, eq(courseOfferings.professorId, professors.id))
    .orderBy(desc(courseOfferings.year), desc(courseOfferings.season));

  // Get TA counts for each offering
  const coverage = await Promise.all(
    offerings.map(async (offering) => {
      const taCount = await db
        .select({ count: users.id })
        .from(taAssignments)
        .where(eq(taAssignments.courseOfferingId, offering.offeringId));

      return {
        ...offering,
        taCount: taCount.length,
        status: taCount.length === 0 ? "No TAs" : `${taCount.length} TA(s)`,
      };
    })
  );

  return coverage;
}

async function generateInvitationStatus() {
  const invitationList = await db
    .select({
      id: invitations.id,
      email: invitations.email,
      inviterFirstName: users.firstName,
      inviterLastName: users.lastName,
      inviterEmail: users.email,
      createdAt: invitations.createdAt,
      expiresAt: invitations.expiresAt,
      usedAt: invitations.usedAt,
      status: invitations.usedAt,
    })
    .from(invitations)
    .leftJoin(users, eq(invitations.invitedBy, users.id))
    .orderBy(desc(invitations.createdAt));

  return invitationList.map(inv => ({
    ...inv,
    status: inv.usedAt ? "Accepted" : new Date() > inv.expiresAt ? "Expired" : "Pending",
  }));
}

async function generateAuditLog() {
  const logs = await db
    .select({
      id: auditLogs.id,
      userEmail: users.email,
      userFirstName: users.firstName,
      userLastName: users.lastName,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      metadata: auditLogs.metadata,
      ipAddress: auditLogs.ipAddress,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .innerJoin(users, eq(auditLogs.userId, users.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(1000);

  return logs;
}

async function generateUserActivity() {
  // Get user list with last activity
  const userActivity = await db
    .select({
      userId: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      createdAt: users.createdAt,
      lastActivity: users.updatedAt,
    })
    .from(users)
    .orderBy(desc(users.updatedAt));

  // Add activity status
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return userActivity.map(user => ({
    ...user,
    activityStatus: user.lastActivity > thirtyDaysAgo ? "Active" : "Inactive",
    daysSinceLastActivity: Math.floor(
      (new Date().getTime() - new Date(user.lastActivity).getTime()) / (1000 * 60 * 60 * 24)
    ),
  }));
}

function convertToCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return "";

  // Get headers from the first object
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(",");

  // Convert each row to CSV
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return "";
      if (typeof value === "string" && value.includes(",")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value.toString();
    }).join(",");
  });

  return [csvHeaders, ...csvRows].join("\n");
}