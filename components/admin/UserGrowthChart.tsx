"use client";

import { useEffect, useState } from "react";
import { SimpleLineChart } from "../charts/SimpleLineChart";
import { Skeleton } from "@/components/ui/Skeleton";

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
  }[];
}

// Skeleton component for loading state
function UserGrowthChartSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <Skeleton variant="text" width="200px" height="24px" />
        <Skeleton variant="text" width="100px" height="16px" />
      </div>
      
      {/* Chart area */}
      <Skeleton variant="rectangular" width="100%" height="200px" className="mb-4" />
      
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
        {[1, 2].map((i) => (
          <div key={i}>
            <Skeleton variant="text" width="120px" height="16px" className="mb-2" />
            <Skeleton variant="text" width="48px" height="32px" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function UserGrowthChart() {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    try {
      const response = await fetch("/api/admin/analytics/user-growth");
      if (!response.ok) throw new Error("Failed to fetch chart data");
      
      const data = await response.json();
      setChartData(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching chart data:", err);
      setError("Failed to load chart data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <UserGrowthChartSkeleton />;
  }

  if (error || !chartData) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">User Growth</h3>
        <div className="text-center text-red-600 p-4">
          {error || "Failed to load chart"}
        </div>
      </div>
    );
  }

  // Transform data for SimpleLineChart
  const chartDataPoints = chartData.labels.map((label, index) => ({
    label: label.slice(0, 3), // Show abbreviated month
    value: chartData.datasets[0].data[index]
  }));

  const totalUsers = chartData.datasets[0].data.reduce((sum, val) => sum + val, 0);
  const avgUsersPerMonth = Math.round(totalUsers / chartData.labels.length);
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">User Growth Over Time</h3>
        <div className="text-sm text-gray-500">
          Last 6 months
        </div>
      </div>
      
      <SimpleLineChart 
        data={chartDataPoints}
        color="rgb(99, 102, 241)"
        height={200}
        className="mb-4"
      />
      
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
        <div>
          <p className="text-sm text-gray-500">Total New Users</p>
          <p className="text-2xl font-semibold text-gray-900">{totalUsers}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Avg. per Month</p>
          <p className="text-2xl font-semibold text-gray-900">{avgUsersPerMonth}</p>
        </div>
      </div>
    </div>
  );
}