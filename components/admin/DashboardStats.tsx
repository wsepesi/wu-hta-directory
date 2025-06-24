"use client";

import { useEffect, useState } from "react";
import StatsCard from "./StatsCard";
import { LoadingSpinner } from "../ui/LoadingSpinner";

interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalProfessors: number;
  totalAssignments: number;
  pendingInvitations: number;
  activeUsers: number;
  userGrowth: {
    value: number;
    isPositive: boolean;
  };
  assignmentGrowth: {
    value: number;
    isPositive: boolean;
  };
}

export default function DashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    // Refresh every minute
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      
      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError("Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
            <div className="px-4 py-5 sm:p-6">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center text-red-600 p-4">
        {error || "Failed to load statistics"}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Users"
        value={stats.totalUsers}
        description={`${stats.activeUsers} active`}
        trend={stats.userGrowth}
        color="indigo"
      />
      <StatsCard
        title="Total Courses"
        value={stats.totalCourses}
        color="green"
      />
      <StatsCard
        title="TA Assignments"
        value={stats.totalAssignments}
        trend={stats.assignmentGrowth}
        color="purple"
      />
      <StatsCard
        title="Pending Invites"
        value={stats.pendingInvitations}
        color="yellow"
      />
    </div>
  );
}