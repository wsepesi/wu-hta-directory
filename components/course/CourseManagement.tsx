'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CourseForm } from './CourseForm';
import { ProfessorForm } from '@/components/professor/ProfessorForm';
import CourseOfferingForm from './CourseOfferingForm';
import { BulkHistoricalOfferings } from './BulkHistoricalOfferings';
import { MissingTAIndicator } from './MissingTAIndicator';
import { EnhancedButton } from '@/components/ui/EnhancedButton';
import { EnhancedErrorMessage } from '@/components/ui/EnhancedErrorMessage';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { showToast } from '@/components/ui/EnhancedToast';
import { apiClient } from '@/lib/api-client';
import type { Course, Professor } from '@/lib/types';

interface CourseOffering {
  id: string;
  semester: string;
  year: number;
  season: string;
  taCount: number;
}

interface CourseWithOfferings {
  id: string;
  courseNumber: string;
  courseName: string;
  offerings: CourseOffering[];
}

interface CourseManagementProps {
  initialCourses: Course[];
  initialProfessors: Professor[];
  coursesWithOfferings: CourseWithOfferings[];
  semesters: { value: string; label: string }[];
}

export function CourseManagement({
  initialCourses,
  initialProfessors,
  coursesWithOfferings,
}: CourseManagementProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'courses' | 'professors' | 'offerings'>('courses');
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showProfessorForm, setShowProfessorForm] = useState(false);
  const [showOfferingForm, setShowOfferingForm] = useState(false);
  const [showBulkHistorical, setShowBulkHistorical] = useState(false);
  const [deletingCourse, setDeletingCourse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);

  const handleCourseSuccess = () => {
    setShowCourseForm(false);
    router.refresh();
  };

  const handleProfessorSuccess = () => {
    setShowProfessorForm(false);
    router.refresh();
  };

  const handleOfferingSuccess = () => {
    setShowOfferingForm(false);
    router.refresh();
  };

  const handleBulkHistoricalSuccess = () => {
    setShowBulkHistorical(false);
    router.refresh();
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;

    setDeletingCourse(courseToDelete);
    setError(null);
    setShowDeleteConfirm(false);

    try {
      const response = await apiClient.delete(`/courses/${courseToDelete}`);
      if (response.error) {
        setError(response.error);
        showToast('error', 'Failed to delete course', { message: response.error });
      } else {
        showToast('success', 'Course deleted successfully');
        router.refresh();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete course';
      setError(errorMessage);
      showToast('error', 'Failed to delete course', { message: errorMessage });
    } finally {
      setDeletingCourse(null);
      setCourseToDelete(null);
    }
  };

  return (
    <>
    <div className="space-y-8">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('courses')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'courses'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Courses
          </button>
          <button
            onClick={() => setActiveTab('professors')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'professors'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Professors
          </button>
          <button
            onClick={() => setActiveTab('offerings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'offerings'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Course Offerings
          </button>
        </nav>
      </div>

      {error && (
        <EnhancedErrorMessage
          message={error}
          onDismiss={() => setError(null)}
        />
      )}

      {/* Tab Content */}
      {activeTab === 'courses' && (
        <div className="space-y-6">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Manage Courses</h2>
                <EnhancedButton onClick={() => setShowCourseForm(!showCourseForm)}>
                  {showCourseForm ? 'Cancel' : 'Add New Course'}
                </EnhancedButton>
              </div>
              
              {showCourseForm && (
                <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                  <CourseForm
                    onSuccess={handleCourseSuccess}
                    onCancel={() => setShowCourseForm(false)}
                  />
                </div>
              )}

              {/* Courses Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Offerings
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        TA Status
                      </th>
                      <th className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {coursesWithOfferings.map((course) => {
                      const currentOfferings = course.offerings.filter(
                        (offering: CourseOffering) => {
                          const currentYear = new Date().getFullYear();
                          const currentMonth = new Date().getMonth();
                          const currentSeason = currentMonth >= 7 ? "Fall" : "Spring";
                          return (
                            offering.year === currentYear &&
                            (offering.season === currentSeason ||
                              (offering.season === "Spring" && currentSeason === "Fall" && currentMonth < 7))
                          );
                        }
                      );
                      
                      const totalTAs = currentOfferings.reduce((sum: number, off: CourseOffering) => sum + off.taCount, 0);
                      const missingHTARecord = currentOfferings.some((off: CourseOffering) => off.taCount === 0);

                      return (
                        <tr key={course.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {course.courseNumber}
                              </div>
                              <div className="text-sm text-gray-500">
                                {course.courseName}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {currentOfferings.length > 0 ? (
                              <div>
                                {currentOfferings.map((offering: CourseOffering, idx: number) => (
                                  <div key={offering.id}>
                                    {offering.semester}
                                    {idx < currentOfferings.length - 1 && ", "}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400">No current offerings</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {currentOfferings.length > 0 ? (
                              <div className="flex items-center space-x-2">
                                <MissingTAIndicator
                                  currentTAs={totalTAs}
                                  requiredTAs={currentOfferings.length}
                                  size="sm"
                                  showLabel={false}
                                />
                                {missingHTARecord && (
                                  <span className="text-xs text-red-600 font-medium">No Head TA Recorded</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <Link
                                href={`/courses/${course.courseNumber.replace(/\s+/g, '-')}`}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                View
                              </Link>
                              <button
                                onClick={() => {
                                  setCourseToDelete(course.id);
                                  setShowDeleteConfirm(true);
                                }}
                                disabled={deletingCourse === course.id}
                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
                              >
                                {deletingCourse === course.id ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'professors' && (
        <div className="space-y-6">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Manage Professors</h2>
                <EnhancedButton onClick={() => setShowProfessorForm(!showProfessorForm)}>
                  {showProfessorForm ? 'Cancel' : 'Add New Professor'}
                </EnhancedButton>
              </div>
              
              {showProfessorForm && (
                <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                  <ProfessorForm
                    onSuccess={handleProfessorSuccess}
                    onCancel={() => setShowProfessorForm(false)}
                  />
                </div>
              )}

              {/* Professors List */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {initialProfessors.map((professor) => (
                  <div key={professor.id} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900">
                      {professor.firstName} {professor.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">{professor.email}</p>
                    <div className="mt-2">
                      <Link
                        href={`/professors/${professor.id}`}
                        className="text-sm text-indigo-600 hover:text-indigo-500"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'offerings' && (
        <div className="space-y-6">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Create Course Offering</h2>
                <div className="flex gap-2">
                  <EnhancedButton 
                    variant="secondary"
                    onClick={() => setShowBulkHistorical(true)}
                  >
                    Bulk Create Historical
                  </EnhancedButton>
                  <EnhancedButton onClick={() => setShowOfferingForm(!showOfferingForm)}>
                    {showOfferingForm ? 'Cancel' : 'Create New Offering'}
                  </EnhancedButton>
                </div>
              </div>
              
              {showOfferingForm && (
                <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                  <CourseOfferingForm
                    courses={initialCourses}
                    professors={initialProfessors}
                    onSuccess={handleOfferingSuccess}
                    onCancel={() => setShowOfferingForm(false)}
                  />
                </div>
              )}

              {/* Recent Offerings */}
              <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Course Offerings</h3>
              <div className="space-y-3">
                {coursesWithOfferings
                  .flatMap(course => 
                    course.offerings.map((offering: CourseOffering) => ({
                      ...offering,
                      courseNumber: course.courseNumber,
                      courseName: course.courseName,
                    }))
                  )
                  .sort((a: CourseOffering & { courseNumber: string; courseName: string }, b: CourseOffering & { courseNumber: string; courseName: string }) => {
                    // Sort by year desc, then by season (Fall before Spring)
                    if (a.year !== b.year) return b.year - a.year;
                    return a.season === 'Fall' ? -1 : 1;
                  })
                  .slice(0, 10)
                  .map((offering: CourseOffering & { courseNumber: string; courseName: string }) => (
                    <div key={offering.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">
                            {offering.courseNumber}: {offering.courseName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {offering.semester} • {offering.taCount} TA{offering.taCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                        {offering.taCount === 0 && (
                          <EnhancedButton
                            size="sm"
                            variant="secondary"
                            onClick={() => router.push(`/courses/${offering.courseNumber.replace(/\s+/g, '-')}`)}
                          >
                            Assign TA
                          </EnhancedButton>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setCourseToDelete(null);
        }}
        onConfirm={handleDeleteCourse}
        title="Delete Course"
        message="Are you sure you want to delete this course? This will also delete all associated course offerings and TA assignments."
        confirmText="Delete Course"
        variant="danger"
        loading={!!deletingCourse}
      />

      <BulkHistoricalOfferings
        isOpen={showBulkHistorical}
        onClose={() => setShowBulkHistorical(false)}
        courses={initialCourses}
        professors={initialProfessors}
        onSuccess={handleBulkHistoricalSuccess}
      />
    </>
  );
}