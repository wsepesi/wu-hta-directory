"use client";

import { useEffect, useState } from "react";
import ActivityFeed from "./ActivityFeed";
import { Skeleton } from "@/components/ui/Skeleton";

interface ActivityItem {
  id: string;
  type: "user" | "invitation" | "course" | "professor" | "ta_assignment" | "system";
  description: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// Skeleton component for loading state
function ActivityTrackerSkeleton() {
  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <Skeleton variant="text" width="140px" height="24px" />
        <Skeleton variant="text" width="60px" height="16px" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
            <Skeleton variant="circular" width={40} height={40} />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" width="80%" height="16px" />
              <Skeleton variant="text" width="120px" height="14px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ActivityTracker() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActivities();
    // Refresh every 30 seconds
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await fetch("/api/admin/activities");
      if (!response.ok) throw new Error("Failed to fetch activities");
      
      const data = await response.json();
      setActivities(data.activities);
      setError(null);
    } catch (err) {
      console.error("Error fetching activities:", err);
      setError("Failed to load activities");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityTrackerSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        <button
          onClick={fetchActivities}
          className="text-sm text-indigo-600 hover:text-indigo-500"
        >
          Refresh
        </button>
      </div>
      <ActivityFeed activities={activities} maxItems={15} />
    </div>
  );
}