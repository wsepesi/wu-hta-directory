import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { userRepository } from "@/lib/repositories/users";
import { logAuditEvent } from "@/lib/audit-logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { role: requestedRole } = await request.json();
    const resolvedParams = await params;

    // Prevent admins from removing their own admin role
    if (resolvedParams.id === session.user.id && requestedRole !== "admin") {
      return NextResponse.json(
        { error: "Cannot remove your own admin role" },
        { status: 400 }
      );
    }

    // Get the user
    const user = await userRepository.findById(resolvedParams.id);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Validate role
    const validRoles = ["head_ta", "admin", "inactive"];
    const newRole = requestedRole || (user.role === "admin" ? "head_ta" : "admin");
    
    if (!validRoles.includes(newRole)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    // Update the role
    const oldRole = user.role;
    const updatedUser = await userRepository.update(resolvedParams.id, { role: newRole });

    // Log the audit event
    await logAuditEvent({
      userId: session.user.id,
      action: "USER_ROLE_CHANGED",
      entityType: "user",
      entityId: resolvedParams.id,
      metadata: {
        userName: `${user.firstName} ${user.lastName}`,
        oldRole,
        newRole,
      }
    });

    return NextResponse.json({ data: updatedUser });
  } catch (error) {
    console.error("Error toggling user role:", error);
    return NextResponse.json(
      { error: "Failed to toggle user role" },
      { status: 500 }
    );
  }
}