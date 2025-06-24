'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useCreateCourse } from '@/hooks/useCourses';
import type { CreateCourseInput, Course } from '@/lib/types';

interface CourseFormProps {
  course?: Course;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CourseForm({ course, onSuccess, onCancel }: CourseFormProps) {
  const router = useRouter();
  const { createCourse, loading, error } = useCreateCourse();
  
  const [formData, setFormData] = useState<CreateCourseInput>({
    courseNumber: course?.courseNumber || '',
    courseName: course?.courseName || '',
    offeringPattern: course?.offeringPattern || 'both',
  });
  
  const [validationErrors, setValidationErrors] = useState<Partial<CreateCourseInput>>({});

  const validateForm = (): boolean => {
    const errors: Partial<CreateCourseInput> = {};
    
    if (!formData.courseNumber.trim()) {
      errors.courseNumber = 'Course number is required';
    } else if (!/^[A-Z]+\s\d+[A-Z]?$/.test(formData.courseNumber.trim())) {
      errors.courseNumber = 'Invalid format. Use format like CSE 131 or MATH 233A';
    }
    
    if (!formData.courseName.trim()) {
      errors.courseName = 'Course name is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const response = await createCourse({
      ...formData,
      courseNumber: formData.courseNumber.trim().toUpperCase(),
      courseName: formData.courseName.trim(),
    });

    if (!response.error) {
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/manage/courses');
        router.refresh();
      }
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear validation error when user types
    if (validationErrors[name as keyof CreateCourseInput]) {
      setValidationErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorMessage message={error} />}
      
      <div>
        <label htmlFor="courseNumber" className="block text-sm font-medium text-gray-700">
          Course Number
        </label>
        <Input
          type="text"
          name="courseNumber"
          id="courseNumber"
          value={formData.courseNumber}
          onChange={handleChange}
          placeholder="CSE 131"
          disabled={loading}
          error={validationErrors.courseNumber}
        />
        {validationErrors.courseNumber && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.courseNumber}</p>
        )}
      </div>

      <div>
        <label htmlFor="courseName" className="block text-sm font-medium text-gray-700">
          Course Name
        </label>
        <Input
          type="text"
          name="courseName"
          id="courseName"
          value={formData.courseName}
          onChange={handleChange}
          placeholder="Introduction to Computer Science"
          disabled={loading}
          error={validationErrors.courseName}
        />
        {validationErrors.courseName && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.courseName}</p>
        )}
      </div>

      <div>
        <label htmlFor="offeringPattern" className="block text-sm font-medium text-gray-700">
          Offering Pattern
        </label>
        <select
          name="offeringPattern"
          id="offeringPattern"
          value={formData.offeringPattern}
          onChange={handleChange}
          disabled={loading}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="both">Fall & Spring</option>
          <option value="fall_only">Fall Only</option>
          <option value="spring_only">Spring Only</option>
          <option value="sparse">Occasionally Offered</option>
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
          {loading ? <LoadingSpinner size="sm" /> : course ? 'Update Course' : 'Add Course'}
        </Button>
      </div>
    </form>
  );
}