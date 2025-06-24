'use client';

import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Link from 'next/link';

interface TAWorkload {
  id: string;
  name: string;
  currentHours: number;
  maxHours: number;
  courseCount: number;
  courses: Array<{
    courseNumber: string;
    hoursPerWeek: number;
  }>;
}

interface WorkloadStats {
  totalTAs: number;
  overloadedTAs: number;
  underutilizedTAs: number;
  averageUtilization: number;
  topWorkloads: TAWorkload[];
}

export function TAWorkloadWidget() {
  const [stats, setStats] = useState<WorkloadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadWorkloadStats();
  }, []);

  const loadWorkloadStats = async () => {
    try {
      // In a real implementation, this would be a dedicated endpoint
      const response = await fetch('/api/ta-assignments');
      if (!response.ok) throw new Error('Failed to load workload stats');
      
      const assignments = await response.json();
      
      // Calculate workload statistics
      const taWorkloads = new Map<string, TAWorkload>();
      
      assignments.forEach((assignment: any) => {
        const taId = assignment.user?.id;
        if (!taId) return;
        
        if (!taWorkloads.has(taId)) {
          taWorkloads.set(taId, {
            id: taId,
            name: `${assignment.user.firstName} ${assignment.user.lastName}`,
            currentHours: 0,
            maxHours: 20, // Default max hours
            courseCount: 0,
            courses: [],
          });
        }
        
        const workload = taWorkloads.get(taId)!;
        workload.currentHours += assignment.hoursPerWeek || 10;
        workload.courseCount += 1;
        workload.courses.push({
          courseNumber: assignment.courseOffering?.course?.courseNumber || 'Unknown',
          hoursPerWeek: assignment.hoursPerWeek || 10,
        });
      });

      const workloadArray = Array.from(taWorkloads.values());
      
      const overloaded = workloadArray.filter(w => w.currentHours > w.maxHours).length;
      const underutilized = workloadArray.filter(w => w.currentHours < w.maxHours * 0.5).length;
      const totalUtilization = workloadArray.reduce((sum, w) => sum + (w.currentHours / w.maxHours), 0);
      
      setStats({
        totalTAs: workloadArray.length,
        overloadedTAs: overloaded,
        underutilizedTAs: underutilized,
        averageUtilization: workloadArray.length > 0 ? (totalUtilization / workloadArray.length) * 100 : 0,
        topWorkloads: workloadArray
          .sort((a, b) => b.currentHours - a.currentHours)
          .slice(0, 5),
      });
    } catch (error) {
      console.error('Failed to load workload stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUtilizationColor = (hours: number, maxHours: number) => {
    const utilization = hours / maxHours;
    if (utilization > 1) return 'text-red-600 bg-red-100';
    if (utilization > 0.8) return 'text-yellow-600 bg-yellow-100';
    if (utilization < 0.5) return 'text-blue-600 bg-blue-100';
    return 'text-green-600 bg-green-100';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">TA Workload</h3>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-semibold text-gray-900">{stats.totalTAs}</p>
            <p className="text-sm text-gray-500">Active TAs</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-red-600">{stats.overloadedTAs}</p>
            <p className="text-sm text-gray-500">Overloaded</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-blue-600">{stats.underutilizedTAs}</p>
            <p className="text-sm text-gray-500">Underutilized</p>
          </div>
        </div>

        {/* Average Utilization */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Average Utilization</p>
            <span className="text-sm font-medium text-gray-900">
              {stats.averageUtilization.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                stats.averageUtilization > 90 ? 'bg-red-500' :
                stats.averageUtilization > 70 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(stats.averageUtilization, 100)}%` }}
            />
          </div>
        </div>

        {/* Top Workloads */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            {expanded ? 'All TA Workloads' : 'Top 5 Workloads'}
          </h4>
          <div className="space-y-2">
            {stats.topWorkloads.map((ta) => (
              <div key={ta.id} className="flex items-center justify-between">
                <Link
                  href={`/people/${ta.id}`}
                  className="flex items-center flex-1 min-w-0 hover:text-indigo-600"
                >
                  <span className="text-sm truncate">{ta.name}</span>
                  <span className="ml-2 text-xs text-gray-500">
                    ({ta.courseCount} {ta.courseCount === 1 ? 'course' : 'courses'})
                  </span>
                </Link>
                <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                  getUtilizationColor(ta.currentHours, ta.maxHours)
                }`}>
                  {ta.currentHours}/{ta.maxHours}h
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        {stats.overloadedTAs > 0 && (
          <div className="border-t pt-4">
            <p className="text-sm text-red-600 mb-3">
              ⚠️ {stats.overloadedTAs} TA{stats.overloadedTAs !== 1 ? 's are' : ' is'} overloaded
            </p>
            <Link
              href="/people?filter=overloaded"
              className="block w-full text-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Review Overloaded TAs
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}