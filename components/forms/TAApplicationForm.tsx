'use client';

import { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { SerifHeading, BodyText } from '../ui/Typography';
import { ErrorMessage } from '../ui/ErrorMessage';
import { clsx } from 'clsx';

interface TAApplicationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  studentId: string;
  major: string;
  year: string;
  gpa: string;
  courses: string[];
  experience: string;
  availability: string;
  whyTA: string;
  resume?: File;
}

interface TAApplicationFormProps {
  availableCourses: Array<{ id: string; code: string; name: string }>;
  onSubmit: (data: TAApplicationData) => Promise<void>;
  className?: string;
}

export function TAApplicationForm({ 
  availableCourses, 
  onSubmit,
  className 
}: TAApplicationFormProps) {
  const [formData, setFormData] = useState<TAApplicationData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    studentId: '',
    major: '',
    year: '',
    gpa: '',
    courses: [],
    experience: '',
    availability: '',
    whyTA: ''
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof TAApplicationData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const updateField = (field: keyof TAApplicationData, value: string | string[] | File) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const toggleCourse = (courseId: string) => {
    setFormData(prev => ({
      ...prev,
      courses: prev.courses.includes(courseId)
        ? prev.courses.filter(id => id !== courseId)
        : [...prev.courses, courseId]
    }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof TAApplicationData, string>> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.studentId.trim()) newErrors.studentId = 'Student ID is required';
    if (!formData.major.trim()) newErrors.major = 'Major is required';
    if (!formData.year) newErrors.year = 'Class year is required';
    if (!formData.gpa.trim()) {
      newErrors.gpa = 'GPA is required';
    } else if (parseFloat(formData.gpa) < 0 || parseFloat(formData.gpa) > 4.0) {
      newErrors.gpa = 'GPA must be between 0.0 and 4.0';
    }
    if (formData.courses.length === 0) {
      newErrors.courses = 'Please select at least one course';
    }
    if (!formData.experience.trim()) newErrors.experience = 'Experience is required';
    if (!formData.availability.trim()) newErrors.availability = 'Availability is required';
    if (!formData.whyTA.trim()) newErrors.whyTA = 'This field is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    try {
      setSubmitting(true);
      setSubmitError(null);
      await onSubmit(formData);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={clsx('space-y-6', className)}>
      {submitError && <ErrorMessage>{submitError}</ErrorMessage>}

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <SerifHeading className="text-xl">Personal Information</SerifHeading>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={formData.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
              error={errors.firstName}
              required
            />
            <Input
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => updateField('lastName', e.target.value)}
              error={errors.lastName}
              required
            />
            <Input
              type="email"
              label="Email Address"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              error={errors.email}
              required
            />
            <Input
              type="tel"
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              error={errors.phone}
              required
            />
          </div>
        </CardBody>
      </Card>

      {/* Academic Information */}
      <Card>
        <CardHeader>
          <SerifHeading className="text-xl">Academic Information</SerifHeading>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Student ID"
              value={formData.studentId}
              onChange={(e) => updateField('studentId', e.target.value)}
              error={errors.studentId}
              required
            />
            <Input
              label="Major"
              value={formData.major}
              onChange={(e) => updateField('major', e.target.value)}
              error={errors.major}
              required
            />
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Class Year <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.year}
                onChange={(e) => updateField('year', e.target.value)}
                className={clsx(
                  'w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-charcoal',
                  errors.year ? 'border-red-500' : 'border-gray-300'
                )}
              >
                <option value="">Select year</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
              {errors.year && (
                <p className="mt-1 text-sm text-red-500">{errors.year}</p>
              )}
            </div>
            <Input
              type="number"
              label="GPA"
              value={formData.gpa}
              onChange={(e) => updateField('gpa', e.target.value)}
              error={errors.gpa}
              step="0.01"
              min="0"
              max="4.0"
              required
            />
          </div>
        </CardBody>
      </Card>

      {/* Course Preferences */}
      <Card>
        <CardHeader>
          <SerifHeading className="text-xl">Course Preferences</SerifHeading>
          <BodyText className="text-sm text-gray-600 mt-1">
            Select all courses you&apos;re interested in TAing
          </BodyText>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availableCourses.map(course => (
              <label
                key={course.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={formData.courses.includes(course.id)}
                  onChange={() => toggleCourse(course.id)}
                  className="mt-1"
                />
                <div>
                  <span className="font-medium text-sm">{course.code}</span>
                  <BodyText className="text-xs text-gray-600">
                    {course.name}
                  </BodyText>
                </div>
              </label>
            ))}
          </div>
          {errors.courses && (
            <p className="mt-2 text-sm text-red-500">{errors.courses}</p>
          )}
        </CardBody>
      </Card>

      {/* Experience & Availability */}
      <Card>
        <CardHeader>
          <SerifHeading className="text-xl">Experience & Availability</SerifHeading>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Relevant Experience <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.experience}
                onChange={(e) => updateField('experience', e.target.value)}
                rows={4}
                className={clsx(
                  'w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-charcoal',
                  errors.experience ? 'border-red-500' : 'border-gray-300'
                )}
                placeholder="Describe any teaching, tutoring, or relevant academic experience..."
              />
              {errors.experience && (
                <p className="mt-1 text-sm text-red-500">{errors.experience}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Availability <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.availability}
                onChange={(e) => updateField('availability', e.target.value)}
                rows={3}
                className={clsx(
                  'w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-charcoal',
                  errors.availability ? 'border-red-500' : 'border-gray-300'
                )}
                placeholder="Describe your weekly availability (e.g., MWF afternoons, T/Th mornings)..."
              />
              {errors.availability && (
                <p className="mt-1 text-sm text-red-500">{errors.availability}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Why do you want to be a TA? <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.whyTA}
                onChange={(e) => updateField('whyTA', e.target.value)}
                rows={4}
                className={clsx(
                  'w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-charcoal',
                  errors.whyTA ? 'border-red-500' : 'border-gray-300'
                )}
                placeholder="Explain your motivation for becoming a TA..."
              />
              {errors.whyTA && (
                <p className="mt-1 text-sm text-red-500">{errors.whyTA}</p>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit Application'}
        </Button>
      </div>
    </form>
  );
}