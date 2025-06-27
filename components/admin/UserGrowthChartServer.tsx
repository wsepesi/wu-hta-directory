import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { sql, gte } from "drizzle-orm";
import UserGrowthChartClient from "./UserGrowthChartClient";

async function getUserGrowthData() {
  // Check authentication and admin role
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
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

  return userGrowthData;
}

export default async function UserGrowthChartServer() {
  const userGrowthData = await getUserGrowthData();

  // Transform data for SimpleLineChart
  const chartDataPoints = userGrowthData.map((item) => ({
    label: item.month.slice(0, 3), // Show abbreviated month
    value: item.count
  }));

  const totalUsers = userGrowthData.reduce((sum, item) => sum + item.count, 0);
  const avgUsersPerMonth = userGrowthData.length > 0 
    ? Math.round(totalUsers / userGrowthData.length) 
    : 0;
  
  return (
    <UserGrowthChartClient
      chartDataPoints={chartDataPoints}
      totalUsers={totalUsers}
      avgUsersPerMonth={avgUsersPerMonth}
    />
  );
}