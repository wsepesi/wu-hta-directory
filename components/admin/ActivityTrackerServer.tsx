import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditLogs, users } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import ActivityFeed from "./ActivityFeed";

interface ActivityItem {
  id: string;
  type: "user" | "invitation" | "course" | "professor" | "ta_assignment" | "system";
  description: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

async function getRecentActivities() {
  // Check authentication and admin role
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  // Fetch recent audit logs with user information
  const recentLogs = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
      userId: auditLogs.userId,
      userFirstName: users.firstName,
      userLastName: users.lastName,
      userEmail: users.email,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(50);

  // Transform audit logs into activity items
  const activities: ActivityItem[] = recentLogs.map((log) => {
    const userName = log.userFirstName && log.userLastName 
      ? `${log.userFirstName} ${log.userLastName}` 
      : log.userEmail || "Unknown user";

    let description = "";
    let type: ActivityItem["type"] = "system";

    // Parse metadata if it exists
    const metadata = log.metadata ? JSON.parse(log.metadata) : {};

    // Generate human-readable descriptions based on action and entity type
    switch (log.entityType) {
      case "user":
        type = "user";
        switch (log.action) {
          case "create":
            description = `${userName} created a new user account`;
            break;
          case "update":
            description = `${userName} updated user profile`;
            break;
          case "login":
            description = `${userName} logged in`;
            break;
          default:
            description = `${userName} performed ${log.action} on user`;
        }
        break;
      
      case "invitation":
        type = "invitation";
        switch (log.action) {
          case "create":
            description = `${userName} sent a new invitation`;
            break;
          case "accept":
            description = `${userName} accepted an invitation`;
            break;
          default:
            description = `${userName} performed ${log.action} on invitation`;
        }
        break;
      
      case "course":
        type = "course";
        description = `${userName} ${log.action}d course ${metadata.courseName || ""}`;
        break;
      
      case "professor":
        type = "professor";
        description = `${userName} ${log.action}d professor ${metadata.professorName || ""}`;
        break;
      
      case "ta_assignment":
        type = "ta_assignment";
        description = `${userName} ${log.action}d TA assignment`;
        break;
      
      default:
        description = `${userName} performed ${log.action} on ${log.entityType}`;
    }

    return {
      id: log.id,
      type,
      description,
      timestamp: log.createdAt,
      metadata,
    };
  });

  return activities;
}

export default async function ActivityTrackerServer() {
  const activities = await getRecentActivities();

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
      </div>
      <ActivityFeed activities={activities} maxItems={15} />
    </div>
  );
}