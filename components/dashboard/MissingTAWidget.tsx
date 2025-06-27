'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import type { CourseOfferingWithRelations } from '@/lib/types';
import { Skeleton } from '@/components/ui/Skeleton';

interface MissingTAWidgetProps {
  initialOfferings?: CourseOfferingWithRelations[];
  showAll?: boolean;
}

// Skeleton component for loading state
function MissingTASkeleton({ showAll = false }: { showAll?: boolean }) {
  const skeletonCount = showAll ? 8 : 5;
  
  return (
    <div className="bg-white">
      <div className="">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Skeleton variant="text" width="300px" height="24px" />
          {!showAll && (
            <Skeleton variant="text" width="80px" height="16px" />
          )}
        </div>


        {/* Course list */}
        <div className="space-y-6">
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <div key={i} className="border-t border-charcoal/20 pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2">
                    <Skeleton variant="text" width="250px" height="24px" />
                  </div>
                  <Skeleton variant="text" width="300px" height="16px" className="mb-1" />
                  <Skeleton variant="text" width="120px" height="16px" className="italic" />
                </div>
                <div className="ml-6 flex flex-col space-y-2">
                  <Skeleton variant="text" width="100px" height="16px" />
                  <Skeleton variant="text" width="100px" height="16px" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MissingTAWidget({ 
  initialOfferings, 
  showAll = false 
}: MissingTAWidgetProps) {
  const { isAuthenticated, isAdmin } = useAuth();
  const [offerings, setOfferings] = useState<CourseOfferingWithRelations[]>(
    initialOfferings || []
  );
  const [loading, setLoading] = useState(!initialOfferings);
  const [error, setError] = useState<string | null>(null);

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
        // Filter for offerings without Head TAs
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


  const getDaysWaiting = (createdAt: string) => {
    const created = new Date(createdAt).getTime();
    const now = Date.now();
    return Math.floor((now - created) / (24 * 60 * 60 * 1000));
  };


  const displayOfferings = showAll ? offerings : offerings.slice(0, 5);

  if (loading) {
    return <MissingTASkeleton showAll={showAll} />;
  }

  if (error) {
    return (
      <div className="bg-white p-6">
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="">
        <div className="flex items-center justify-between mb-6">
          <p className="font-serif text-lg text-charcoal">
            {offerings.length} courses without recorded Head TAs
          </p>
          {!showAll && offerings.length > 5 && (
            <Link
              href="/dashboard/missing-records"
              className="font-serif text-sm text-charcoal hover:opacity-70 transition-opacity duration-200"
            >
              View all →
            </Link>
          )}
        </div>


        {displayOfferings.length === 0 ? (
          <div className="text-center py-12">
            <p className="font-serif text-lg text-charcoal/60">
              All courses have recorded Head TAs!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {displayOfferings.map((offering) => {
              const days = getDaysWaiting(offering.createdAt.toString());
              return (
                <div
                  key={offering.id}
                  className="border-t border-charcoal/20 pt-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-serif text-lg text-charcoal mb-2">
                        {offering.course?.courseNumber}: {offering.course?.courseName}
                      </h4>
                      <p className="text-sm text-charcoal/80 mb-1">
                        {offering.semester} • Professor: {
                          offering.professor 
                            ? `${offering.professor.firstName} ${offering.professor.lastName}`
                            : 'Not assigned'
                        }
                      </p>
                      <p className="font-serif text-sm italic text-charcoal/60">
                        Unrecorded for {days} day{days !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="ml-6 flex flex-col space-y-2">
                      <Link
                        href={`/courses/${offering.course?.courseNumber.replace(/\s+/g, '-')}`}
                        className="font-serif text-sm text-charcoal hover:opacity-70 transition-opacity duration-200"
                      >
                        View Course →
                      </Link>
                      {isAuthenticated && isAdmin && (
                        <Link
                          href={`/auth/invite?courseOfferingId=${offering.id}`}
                          className="font-serif text-sm text-charcoal hover:opacity-70 transition-opacity duration-200"
                        >
                          Record Head TA →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showAll && offerings.length > displayOfferings.length && (
          <div className="mt-8 text-center">
            <p className="font-serif text-sm italic text-charcoal/60">
              Showing {displayOfferings.length} of {offerings.length} courses
            </p>
          </div>
        )}
      </div>
    </div>
  );
}