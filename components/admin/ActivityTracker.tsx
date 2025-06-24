"use client";

import { useEffect, useState } from "react";
import ActivityFeed from "./ActivityFeed";
import { LoadingSpinner } from "../ui/LoadingSpinner";

interface ActivityItem {
  id: string;
  type: "user" | "invitation" | "course" | "professor" | "ta_assignment" | "system";
  description: string;
  timestamp: Date;
  metadata?: Record<string, any>;
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
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
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