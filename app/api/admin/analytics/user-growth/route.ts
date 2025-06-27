import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { sql, gte } from "drizzle-orm";

export async function GET() {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user registrations for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const userGrowthData = await db
      .select({
        month: sql<string>`to_char(created_at, 'Mon YYYY')`,
        count: sql<number>`count(*)::int`,
        monthOrder: sql<string>`to_char(created_at, 'YYYY-MM')`,
      })
      .from(users)
      .where(gte(users.createdAt, sixMonthsAgo))
      .groupBy(sql`to_char(created_at, 'Mon YYYY'), to_char(created_at, 'YYYY-MM')`)
      .orderBy(sql`to_char(created_at, 'YYYY-MM')`);

    // Format data for chart
    const chartData = {
      labels: userGrowthData.map(d => d.month),
      datasets: [{
        label: "New Users",
        data: userGrowthData.map(d => d.count),
        borderColor: "rgb(99, 102, 241)",
        backgroundColor: "rgba(99, 102, 241, 0.1)",
      }],
    };

    return NextResponse.json(chartData);
  } catch (error) {
    console.error("Error fetching user growth data:", error);
    return NextResponse.json(
      { error: "Failed to fetch user growth data" },
      { status: 500 }
    );
  }
}