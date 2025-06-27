'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/Skeleton';

interface CourseStats {
  totalCourses: number;
  activeOfferings: number;
  coursesWithoutTAs: number;
  coursesWithoutProfessors: number;
  taAssignmentRate: number;
  averageTAsPerCourse: number;
  upcomingSemester: {
    name: string;
    plannedOfferings: number;
    missingHeadTARecords: number;
  };
}

// Skeleton component for loading state
function CourseStatsSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <Skeleton variant="text" width="160px" height="24px" />
      </div>
      
      <div className="p-6 space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i}>
              <Skeleton variant="text" width="100px" height="16px" className="mb-2" />
              <Skeleton variant="text" width="48px" height="32px" />
            </div>
          ))}
        </div>

        {/* TA Assignment Rate */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Skeleton variant="text" width="140px" height="16px" />
            <Skeleton variant="text" width="48px" height="16px" />
          </div>
          <Skeleton variant="rectangular" width="100%" height="8px" className="rounded-full" />
        </div>

        {/* Issues Section */}
        <div>
          <Skeleton variant="text" width="80px" height="16px" className="mb-3" />
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100">
                <Skeleton variant="text" width="180px" height="16px" />
                <Skeleton variant="text" width="60px" height="16px" />
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t">
          <Skeleton variant="rectangular" width="100%" height="36px" className="rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function CourseStatsWidget() {
  const [stats, setStats] = useState<CourseStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) throw new Error('Failed to load stats');
      
      const data = await response.json();
      
      // Calculate course-specific stats
      const courseStats: CourseStats = {
        totalCourses: data.courseCount || 0,
        activeOfferings: data.activeOfferings || 0,
        coursesWithoutTAs: data.coursesWithoutTAs || 0,
        coursesWithoutProfessors: data.coursesWithoutProfessors || 0,
        taAssignmentRate: data.activeOfferings > 0 
          ? ((data.activeOfferings - data.coursesWithoutTAs) / data.activeOfferings) * 100 
          : 0,
        averageTAsPerCourse: data.totalTAAssignments && data.activeOfferings > 0
          ? data.totalTAAssignments / data.activeOfferings
          : 0,
        upcomingSemester: data.upcomingSemester || {
          name: 'Next Semester',
          plannedOfferings: 0,
          missingHeadTARecords: 0,
        },
      };

      setStats(courseStats);
    } catch (error) {
      console.error('Failed to load course stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <CourseStatsSkeleton />;
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Course Statistics</h3>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Total Courses</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.totalCourses}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Active Offerings</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.activeOfferings}</p>
          </div>
        </div>

        {/* TA Assignment Rate */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">TA Assignment Rate</p>
            <span className="text-sm font-medium text-gray-900">
              {stats.taAssignmentRate.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${stats.taAssignmentRate}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Average {stats.averageTAsPerCourse.toFixed(1)} TAs per course
          </p>
        </div>

        {/* Issues */}
        <div className="space-y-3">
          {stats.coursesWithoutTAs > 0 && (
            <Link
              href="/dashboard/missing-records"
              className="flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <div className="flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                <span className="text-sm text-red-900">Courses without TAs</span>
              </div>
              <span className="text-sm font-medium text-red-900">{stats.coursesWithoutTAs}</span>
            </Link>
          )}
          
          {stats.coursesWithoutProfessors > 0 && (
            <Link
              href="/manage/courses"
              className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <div className="flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-sm text-yellow-900">Courses without professors</span>
              </div>
              <span className="text-sm font-medium text-yellow-900">{stats.coursesWithoutProfessors}</span>
            </Link>
          )}
        </div>

        {/* Upcoming Semester */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            {stats.upcomingSemester.name}
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Planned Offerings</span>
              <span className="text-sm font-medium text-gray-900">
                {stats.upcomingSemester.plannedOfferings}
              </span>
            </div>
            {stats.upcomingSemester.missingHeadTARecords > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Need TAs</span>
                <span className="text-sm font-medium text-red-600">
                  {stats.upcomingSemester.missingHeadTARecords}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="border-t pt-4 space-y-2">
          <Link
            href="/manage/courses"
            className="block w-full text-center px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100"
          >
            Manage Courses
          </Link>
          <Link
            href="/dashboard/missing-records"
            className="block w-full text-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            View Missing TAs
          </Link>
        </div>
      </div>
    </div>
  );
}