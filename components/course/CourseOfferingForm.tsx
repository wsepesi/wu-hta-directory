"use client";

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { Course, Professor, CourseOffering } from "@/lib/types";
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useCourseOfferings } from '@/hooks/useCourses';

interface CourseOfferingFormProps {
  courses: Course[];
  professors: Professor[];
  offering?: CourseOffering;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CourseOfferingForm({
  courses,
  professors,
  offering,
  onSuccess,
  onCancel,
}: CourseOfferingFormProps) {
  const router = useRouter();
  const { createOffering, updateOffering, loading, error } = useCourseOfferings();
  
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const currentSeason = currentMonth >= 7 ? "Fall" : "Spring";

  const [selectedCourse, setSelectedCourse] = useState(offering?.courseId || "");
  const [selectedSemester, setSelectedSemester] = useState(
    offering?.semester || `${currentSeason} ${currentYear}`
  );
  const [selectedProfessor, setSelectedProfessor] = useState(offering?.professorId || "");
  const [validationError, setValidationError] = useState<string | null>(null);

  const semesters = [
    {
      value: `${currentSeason} ${currentYear}`,
      label: `${currentSeason} ${currentYear} (Current)`,
    },
    {
      value:
        currentSeason === "Fall"
          ? `Spring ${currentYear + 1}`
          : `Fall ${currentYear}`,
      label:
        currentSeason === "Fall"
          ? `Spring ${currentYear + 1}`
          : `Fall ${currentYear}`,
    },
    {
      value:
        currentSeason === "Fall"
          ? `Fall ${currentYear + 1}`
          : `Spring ${currentYear + 1}`,
      label:
        currentSeason === "Fall"
          ? `Fall ${currentYear + 1}`
          : `Spring ${currentYear + 1}`,
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    
    if (!selectedCourse) {
      setValidationError('Please select a course');
      return;
    }
    
    // Parse semester into year and season
    const [season, year] = selectedSemester.split(' ');
    
    try {
      const data = {
        courseId: selectedCourse,
        semester: selectedSemester,
        year: parseInt(year),
        season: season as 'Fall' | 'Spring',
        professorId: selectedProfessor || null,
      };
      
      if (offering) {
        await updateOffering(offering.id, data);
      } else {
        await createOffering(data);
      }
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/manage/courses');
        router.refresh();
      }
    } catch (err) {
      // Error is already set by the hook
      console.error('Failed to save offering:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorMessage message={error} />}
      {validationError && <ErrorMessage message={validationError} />}
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="courseId"
            className="block text-sm font-medium text-gray-700"
          >
            Course
          </label>
          <select
            name="courseId"
            id="courseId"
            required
            value={selectedCourse}
            onChange={(e) => {
              setSelectedCourse(e.target.value);
              setValidationError(null);
            }}
            disabled={loading || !!offering}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
          >
            <option value="">Select a course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.courseNumber}: {course.courseName}
              </option>
            ))}
          </select>
          {offering && (
            <p className="mt-1 text-xs text-gray-500">Course cannot be changed for existing offerings</p>
          )}
        </div>

        <div>
          <label
            htmlFor="semester"
            className="block text-sm font-medium text-gray-700"
          >
            Semester
          </label>
          <select
            name="semester"
            id="semester"
            required
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            disabled={loading}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
          >
            {semesters.map((sem) => (
              <option key={sem.value} value={sem.value}>
                {sem.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="professorId"
          className="block text-sm font-medium text-gray-700"
        >
          Professor (Optional)
        </label>
        <select
          name="professorId"
          id="professorId"
          value={selectedProfessor}
          onChange={(e) => setSelectedProfessor(e.target.value)}
          disabled={loading}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
        >
          <option value="">Select a professor</option>
          {professors.map((professor) => (
            <option key={professor.id} value={professor.id}>
              {professor.firstName} {professor.lastName}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? <LoadingSpinner size="sm" /> : offering ? 'Update Offering' : 'Create Offering'}
        </Button>
      </div>
    </form>
  );
}