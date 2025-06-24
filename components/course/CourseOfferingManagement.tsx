'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { TAAssignmentModal } from './TAAssignmentModal';
import { useCourseOfferings } from '@/hooks/useCourses';
import { useProfessors } from '@/hooks/useProfessors';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';

interface CourseOffering {
  id: string;
  courseId: string;
  courseNumber: string;
  courseName: string;
  semester: string;
  year: number;
  season: string;
  professor?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  taAssignments: Array<{
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
    };
    hoursPerWeek: number;
  }>;
}

interface CourseOfferingManagementProps {
  courseId: string;
  courseNumber: string;
  courseName: string;
  offerings: CourseOffering[];
  onUpdate: () => void;
}

export function CourseOfferingManagement({
  courseId,
  courseNumber,
  courseName,
  offerings,
  onUpdate,
}: CourseOfferingManagementProps) {
  const [editingOffering, setEditingOffering] = useState<string | null>(null);
  const [assigningTA, setAssigningTA] = useState<string | null>(null);
  const [showNewOfferingForm, setShowNewOfferingForm] = useState(false);
  const [newOffering, setNewOffering] = useState({
    semester: '',
    year: new Date().getFullYear(),
    season: 'Fall',
    professorId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { createOffering, updateOffering, deleteOffering } = useCourseOfferings();
  const { professors } = useProfessors();

  const currentYear = new Date().getFullYear();
  const semesters = [
    { value: 'Spring', label: 'Spring' },
    { value: 'Summer', label: 'Summer' },
    { value: 'Fall', label: 'Fall' },
  ];

  const handleCreateOffering = async () => {
    setLoading(true);
    setError(null);

    try {
      await createOffering({
        courseId,
        semester: `${newOffering.season} ${newOffering.year}`,
        year: newOffering.year,
        season: newOffering.season,
        professorId: newOffering.professorId || null,
      });
      setShowNewOfferingForm(false);
      setNewOffering({
        semester: '',
        year: currentYear,
        season: 'Fall',
        professorId: '',
      });
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to create offering');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfessor = async (offeringId: string, professorId: string) => {
    try {
      await updateOffering(offeringId, { professorId: professorId || null });
      setEditingOffering(null);
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to update professor');
    }
  };

  const handleDeleteOffering = async (offeringId: string) => {
    if (!confirm('Are you sure you want to delete this offering? This will also remove all TA assignments.')) {
      return;
    }

    try {
      await deleteOffering(offeringId);
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to delete offering');
    }
  };

  const handleRemoveTA = async (offeringId: string, assignmentId: string) => {
    if (!confirm('Are you sure you want to remove this TA assignment?')) {
      return;
    }

    try {
      await fetch(`/api/ta-assignments/${assignmentId}`, { method: 'DELETE' });
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to remove TA');
    }
  };

  const getAssigningOffering = () => {
    return offerings.find(o => o.id === assigningTA);
  };

  return (
    <div className="space-y-6">
      {error && <ErrorMessage message={error} />}

      {/* Add New Offering Button/Form */}
      {!showNewOfferingForm ? (
        <Button
          onClick={() => setShowNewOfferingForm(true)}
          className="w-full sm:w-auto"
        >
          Add New Offering
        </Button>
      ) : (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-4">New Course Offering</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <select
              value={newOffering.season}
              onChange={(e) => setNewOffering({ ...newOffering, season: e.target.value })}
              className="rounded-md border-gray-300"
            >
              {semesters.map(sem => (
                <option key={sem.value} value={sem.value}>{sem.label}</option>
              ))}
            </select>
            <Input
              type="number"
              value={newOffering.year}
              onChange={(e) => setNewOffering({ ...newOffering, year: parseInt(e.target.value) })}
              min={currentYear}
              max={currentYear + 2}
            />
            <select
              value={newOffering.professorId}
              onChange={(e) => setNewOffering({ ...newOffering, professorId: e.target.value })}
              className="rounded-md border-gray-300"
            >
              <option value="">No professor</option>
              {professors.map(prof => (
                <option key={prof.id} value={prof.id}>
                  {prof.firstName} {prof.lastName}
                </option>
              ))}
            </select>
            <div className="flex space-x-2">
              <Button
                onClick={handleCreateOffering}
                disabled={loading}
                size="sm"
              >
                {loading ? <LoadingSpinner size="sm" /> : 'Create'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowNewOfferingForm(false)}
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Offerings List */}
      <div className="space-y-4">
        {offerings.map((offering) => (
          <div key={offering.id} className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">
                  {offering.semester}
                </h3>
                
                {/* Professor Assignment */}
                <div className="mt-2">
                  {editingOffering === offering.id ? (
                    <div className="flex items-center space-x-2">
                      <select
                        defaultValue={offering.professor?.id || ''}
                        onChange={(e) => handleUpdateProfessor(offering.id, e.target.value)}
                        className="text-sm rounded-md border-gray-300"
                      >
                        <option value="">No professor</option>
                        {professors.map(prof => (
                          <option key={prof.id} value={prof.id}>
                            {prof.firstName} {prof.lastName}
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setEditingOffering(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        Professor: {offering.professor 
                          ? `${offering.professor.firstName} ${offering.professor.lastName}`
                          : <span className="text-yellow-600">Not assigned</span>
                        }
                      </span>
                      <button
                        onClick={() => setEditingOffering(offering.id)}
                        className="text-xs text-indigo-600 hover:text-indigo-500"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>

                {/* TA Assignments */}
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-700">Head TAs</h4>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setAssigningTA(offering.id)}
                    >
                      Assign TA
                    </Button>
                  </div>
                  {offering.taAssignments.length === 0 ? (
                    <p className="text-sm text-yellow-600">No TAs assigned</p>
                  ) : (
                    <div className="space-y-2">
                      {offering.taAssignments.map((assignment) => (
                        <div key={assignment.id} className="flex items-center justify-between">
                          <Link
                            href={`/people/${assignment.user.id}`}
                            className="text-sm text-indigo-600 hover:text-indigo-500"
                          >
                            {assignment.user.firstName} {assignment.user.lastName}
                            <span className="text-gray-500 ml-1">
                              ({assignment.hoursPerWeek}h/week)
                            </span>
                          </Link>
                          <button
                            onClick={() => handleRemoveTA(offering.id, assignment.id)}
                            className="text-xs text-red-600 hover:text-red-500"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="ml-4">
                <button
                  onClick={() => handleDeleteOffering(offering.id)}
                  className="text-sm text-red-600 hover:text-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* TA Assignment Modal */}
      {assigningTA && (
        <TAAssignmentModal
          courseOfferingId={assigningTA}
          courseNumber={courseNumber}
          courseName={courseName}
          semester={getAssigningOffering()?.semester || ''}
          isOpen={!!assigningTA}
          onClose={() => setAssigningTA(null)}
          onSuccess={onUpdate}
        />
      )}
    </div>
  );
}