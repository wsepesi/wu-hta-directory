import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { userPrivacySettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const privacySettingsSchema = z.object({
  showEmail: z.boolean(),
  showGradYear: z.boolean(),
  showLocation: z.boolean(),
  showLinkedIn: z.boolean(),
  showPersonalSite: z.boolean(),
  showCourses: z.boolean(),
  appearInDirectory: z.boolean(),
  allowContact: z.boolean(),
});

interface Params {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/users/[id]/privacy - Get privacy settings
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Users can only view their own privacy settings unless they're admin
    if (session.user.id !== id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [settings] = await db
      .select()
      .from(userPrivacySettings)
      .where(eq(userPrivacySettings.userId, id))
      .limit(1);

    // Return default settings if none exist
    const defaultSettings = {
      showEmail: false,
      showGradYear: true,
      showLocation: true,
      showLinkedIn: true,
      showPersonalSite: true,
      showCourses: true,
      appearInDirectory: true,
      allowContact: true,
    };

    return NextResponse.json(settings || defaultSettings);
  } catch (error) {
    console.error("Error fetching privacy settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch privacy settings" },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id]/privacy - Update privacy settings
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Users can only update their own privacy settings unless they're admin
    if (session.user.id !== id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = privacySettingsSchema.parse(body);

    // Check if settings already exist
    const [existingSettings] = await db
      .select()
      .from(userPrivacySettings)
      .where(eq(userPrivacySettings.userId, id))
      .limit(1);

    if (existingSettings) {
      // Update existing settings
      await db
        .update(userPrivacySettings)
        .set({
          ...validatedData,
          updatedAt: new Date(),
        })
        .where(eq(userPrivacySettings.userId, id));
    } else {
      // Create new settings
      await db.insert(userPrivacySettings).values({
        userId: id,
        ...validatedData,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating privacy settings:", error);
    return NextResponse.json(
      { error: "Failed to update privacy settings" },
      { status: 500 }
    );
  }
}