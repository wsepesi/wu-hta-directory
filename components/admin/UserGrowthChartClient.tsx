"use client";

import { SimpleLineChart } from "../charts/SimpleLineChart";

interface ChartData {
  label: string;
  value: number;
}

interface UserGrowthChartClientProps {
  chartDataPoints: ChartData[];
  totalUsers: number;
  avgUsersPerMonth: number;
}

export default function UserGrowthChartClient({ 
  chartDataPoints, 
  totalUsers, 
  avgUsersPerMonth 
}: UserGrowthChartClientProps) {
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