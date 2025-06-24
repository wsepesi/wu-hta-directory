'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { MissingTAIndicator } from '@/components/course/MissingTAIndicator';
import { apiClient } from '@/lib/api-client';
import type { CourseOfferingWithRelations } from '@/lib/types';

interface MissingTAWidgetProps {
  initialOfferings?: CourseOfferingWithRelations[];
  showAll?: boolean;
}

export function MissingTAWidget({ 
  initialOfferings, 
  showAll = false 
}: MissingTAWidgetProps) {
  const [offerings, setOfferings] = useState<CourseOfferingWithRelations[]>(
    initialOfferings || []
  );
  const [loading, setLoading] = useState(!initialOfferings);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'urgent' | 'recent'>('urgent');

  useEffect(() => {
    if (!initialOfferings) {
      fetchMissingTAs();
    }
  }, [initialOfferings]);

  const fetchMissingTAs = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<CourseOfferingWithRelations[]>(
        '/course-offerings?include=relations'
      );

      if (response.data) {
        // Filter for offerings without TAs
        const missingTAs = response.data.filter(
          offering => !offering.taAssignments || offering.taAssignments.length === 0
        );
        setOfferings(missingTAs);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredOfferings = () => {
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;

    switch (filter) {
      case 'urgent':
        return offerings.filter(o => {
          const createdAt = new Date(o.createdAt).getTime();
          const daysSince = Math.floor((now - createdAt) / dayInMs);
          return daysSince > 7;
        });
      case 'recent':
        return offerings.filter(o => {
          const createdAt = new Date(o.createdAt).getTime();
          const daysSince = Math.floor((now - createdAt) / dayInMs);
          return daysSince <= 7;
        });
      default:
        return offerings;
    }
  };

  const getDaysWaiting = (createdAt: string) => {
    const created = new Date(createdAt).getTime();
    const now = Date.now();
    return Math.floor((now - created) / (24 * 60 * 60 * 1000));
  };

  const getUrgencyBadge = (days: number) => {
    if (days > 14) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
          URGENT
        </span>
      );
    } else if (days > 7) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
          High Priority
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
          New
        </span>
      );
    }
  };

  const filteredOfferings = getFilteredOfferings();
  const displayOfferings = showAll ? filteredOfferings : filteredOfferings.slice(0, 5);

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Courses Missing TAs</h3>
            <p className="mt-1 text-sm text-gray-500">
              {offerings.length} courses need head TAs assigned
            </p>
          </div>
          {!showAll && offerings.length > 5 && (
            <Link
              href="/dashboard/missing-tas"
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              View all →
            </Link>
          )}
        </div>

        {showAll && (
          <div className="mb-4 flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded-md ${
                filter === 'all'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              All ({offerings.length})
            </button>
            <button
              onClick={() => setFilter('urgent')}
              className={`px-3 py-1 text-sm rounded-md ${
                filter === 'urgent'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Urgent ({offerings.filter(o => getDaysWaiting(o.createdAt) > 7).length})
            </button>
            <button
              onClick={() => setFilter('recent')}
              className={`px-3 py-1 text-sm rounded-md ${
                filter === 'recent'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Recent ({offerings.filter(o => getDaysWaiting(o.createdAt) <= 7).length})
            </button>
          </div>
        )}

        {displayOfferings.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500">
              {filter === 'all' 
                ? 'All courses have TAs assigned!'
                : `No ${filter} courses missing TAs`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayOfferings.map((offering) => {
              const days = getDaysWaiting(offering.createdAt);
              return (
                <div
                  key={offering.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900">
                          {offering.course?.courseNumber}: {offering.course?.courseName}
                        </h4>
                        {getUrgencyBadge(days)}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {offering.semester} • Professor: {
                          offering.professor 
                            ? `${offering.professor.firstName} ${offering.professor.lastName}`
                            : 'Not assigned'
                        }
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        Waiting for {days} day{days !== 1 ? 's' : ''}
                      </p>
                      <div className="mt-2">
                        <MissingTAIndicator
                          currentTAs={0}
                          requiredTAs={1}
                          size="sm"
                        />
                      </div>
                    </div>
                    <div className="ml-4 flex flex-col space-y-2">
                      <Link
                        href={`/courses/${offering.course?.courseNumber.replace(/\s+/g, '-')}`}
                        className="text-sm text-indigo-600 hover:text-indigo-500"
                      >
                        View Course
                      </Link>
                      <Link
                        href={`/auth/invite?courseOfferingId=${offering.id}`}
                        className="text-sm text-green-600 hover:text-green-500"
                      >
                        Invite TA
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showAll && filteredOfferings.length > displayOfferings.length && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Showing {displayOfferings.length} of {filteredOfferings.length} courses
            </p>
          </div>
        )}
      </div>
    </div>
  );
}