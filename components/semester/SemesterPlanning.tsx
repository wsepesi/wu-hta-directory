'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Card } from '@/components/ui/Card';
import { useCourseOfferings } from '@/hooks/useCourses';
import type { Course, CourseOffering } from '@/lib/types';

interface SemesterPlanningProps {
  courses: Course[];
  currentOfferings: CourseOffering[];
  targetSemester: string;
  targetYear: number;
  targetSeason: 'Fall' | 'Spring';
}

export function SemesterPlanning({
  courses,
  currentOfferings,
  targetSemester,
  targetYear,
  targetSeason,
}: SemesterPlanningProps) {
  const { createOffering, error } = useCourseOfferings();
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Get courses that haven't been offered this semester yet
  const getSuggestedCourses = () => {
    return courses.filter(course => {
      // Check if already offered this semester
      const alreadyOffered = currentOfferings.some(
        o => o.courseId === course.id && o.semester === targetSemester
      );
      return !alreadyOffered;
    });
  };

  const suggestedCourses = getSuggestedCourses();

  const handleSelectAll = () => {
    setSelectedCourses(suggestedCourses.map(c => c.id));
  };

  const handleDeselectAll = () => {
    setSelectedCourses([]);
  };

  const handleToggleCourse = (courseId: string) => {
    setSelectedCourses(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleCreateOfferings = async () => {
    if (selectedCourses.length === 0) {
      return;
    }

    setCreating(true);
    setSuccessMessage('');
    let successCount = 0;
    let failCount = 0;

    for (const courseId of selectedCourses) {
      try {
        await createOffering({
          courseId,
          semester: targetSemester,
          year: targetYear,
          season: targetSeason,
          professorId: null,
        });
        successCount++;
      } catch (err) {
        failCount++;
        console.error(`Failed to create offering for course ${courseId}:`, err);
      }
    }

    setCreating(false);
    setSelectedCourses([]);
    
    if (successCount > 0) {
      setSuccessMessage(
        `Successfully created ${successCount} course offering${successCount > 1 ? 's' : ''}.${
          failCount > 0 ? ` ${failCount} failed.` : ''
        }`
      );
      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Plan {targetSemester} Offerings
            </h3>
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSelectAll}
                disabled={creating}
              >
                Select All
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDeselectAll}
                disabled={creating}
              >
                Deselect All
              </Button>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            {suggestedCourses.length} courses have not been scheduled for {targetSemester} yet.
            Select the courses you want to create offerings for:
          </p>

          {error && <ErrorMessage message={error} className="mb-4" />}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          )}

          {suggestedCourses.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              All expected courses for this semester have already been created.
            </p>
          ) : (
            <>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {suggestedCourses.map(course => (
                  <label
                    key={course.id}
                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCourses.includes(course.id)}
                      onChange={() => handleToggleCourse(course.id)}
                      disabled={creating}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {course.courseNumber}: {course.courseName}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  onClick={handleCreateOfferings}
                  disabled={creating || selectedCourses.length === 0}
                >
                  {creating ? 
                    'Creating Offerings...' : 
                    `Create ${selectedCourses.length} Offering${selectedCourses.length !== 1 ? 's' : ''}`
                  }
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Current Offerings Summary */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Current {targetSemester} Offerings
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {currentOfferings.length} courses are already scheduled for {targetSemester}.
          </p>
          
          {currentOfferings.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentOfferings
                .sort((a, b) => {
                  const courseA = courses.find(c => c.id === a.courseId);
                  const courseB = courses.find(c => c.id === b.courseId);
                  return (courseA?.courseNumber || '').localeCompare(courseB?.courseNumber || '');
                })
                .map(offering => {
                  const course = courses.find(c => c.id === offering.courseId);
                  return (
                    <div key={offering.id} className="text-sm text-gray-600">
                      {course?.courseNumber}: {course?.courseName}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}