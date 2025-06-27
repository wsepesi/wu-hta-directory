import { db } from "./db";
import { auditLogs } from "./db/schema";
import { headers } from "next/headers";
import { desc, eq, and, gte, lte } from "drizzle-orm";

export type AuditAction = 
  | "USER_CREATED"
  | "USER_UPDATED"
  | "USER_DELETED"
  | "USER_ROLE_CHANGED"
  | "USER_ACTIVATED"
  | "USER_DEACTIVATED"
  | "INVITATION_SENT"
  | "INVITATION_ACCEPTED"
  | "INVITATION_EXPIRED"
  | "COURSE_CREATED"
  | "COURSE_UPDATED"
  | "COURSE_DELETED"
  | "PROFESSOR_CREATED"
  | "PROFESSOR_UPDATED"
  | "PROFESSOR_DELETED"
  | "TA_ASSIGNMENT_CREATED"
  | "TA_ASSIGNMENT_UPDATED"
  | "TA_ASSIGNMENT_DELETED"
  | "ADMIN_ACCESS"
  | "BULK_OPERATION"
  | "REPORT_GENERATED"
  | "DATA_EXPORTED";

export type EntityType = "user" | "invitation" | "course" | "professor" | "ta_assignment" | "system";

interface AuditLogEntry {
  userId: string;
  action: AuditAction;
  entityType: EntityType;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export async function logAuditEvent(entry: AuditLogEntry) {
  try {
    // Get request headers for IP and user agent
    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    await db.insert(auditLogs).values({
      userId: entry.userId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
      ipAddress: ipAddress.split(",")[0].trim(), // Take first IP if multiple
      userAgent,
    });
  } catch (error) {
    // Log to console but don't throw - we don't want audit logging failures to break operations
    console.error("Failed to log audit event:", error);
  }
}

export async function getAuditLogs(filters?: {
  userId?: string;
  action?: AuditAction;
  entityType?: EntityType;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  // Build conditions
  const conditions = [];
  if (filters?.userId) {
    conditions.push(eq(auditLogs.userId, filters.userId));
  }
  if (filters?.action) {
    conditions.push(eq(auditLogs.action, filters.action));
  }
  if (filters?.entityType) {
    conditions.push(eq(auditLogs.entityType, filters.entityType));
  }
  if (filters?.entityId) {
    conditions.push(eq(auditLogs.entityId, filters.entityId));
  }
  if (filters?.startDate) {
    conditions.push(gte(auditLogs.createdAt, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(auditLogs.createdAt, filters.endDate));
  }

  // Build the query in one chain to avoid type issues
  const queryBuilder = db.select().from(auditLogs);
  
  const queryWithConditions = conditions.length > 0 
    ? queryBuilder.where(conditions.length === 1 ? conditions[0] : and(...conditions))
    : queryBuilder;

  const queryWithOrder = queryWithConditions.orderBy(desc(auditLogs.createdAt));
  
  const finalQuery = filters?.limit 
    ? queryWithOrder.limit(filters.limit)
    : queryWithOrder;

  return await finalQuery;
}

// Helper function to get activity feed items
export async function getActivityFeedItems(limit: number = 20) {
  const logs = await getAuditLogs({ limit });
  
  return logs.map(log => {
    const metadata = log.metadata ? JSON.parse(log.metadata) : {};
    
    // Generate human-readable descriptions based on action
    let description = "";
    switch (log.action) {
      case "USER_CREATED":
        description = `New user registered: ${metadata.userName || "Unknown"}`;
        break;
      case "USER_ROLE_CHANGED":
        description = `User role changed from ${metadata.oldRole} to ${metadata.newRole}`;
        break;
      case "INVITATION_SENT":
        description = `Invitation sent to ${metadata.email}`;
        break;
      case "INVITATION_ACCEPTED":
        description = `Invitation accepted by ${metadata.email}`;
        break;
      case "COURSE_CREATED":
        description = `Course created: ${metadata.courseName}`;
        break;
      case "TA_ASSIGNMENT_CREATED":
        description = `TA assigned to ${metadata.courseName}`;
        break;
      default:
        description = `${log.action.replace(/_/g, " ").toLowerCase()}`;
    }
    
    return {
      id: log.id,
      type: log.entityType,
      description,
      timestamp: log.createdAt,
      metadata,
    };
  });
}