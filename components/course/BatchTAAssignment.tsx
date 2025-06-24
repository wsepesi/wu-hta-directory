'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTAAssignments } from '@/hooks/useTAAssignments';

interface BatchAssignment {
  courseOfferingId: string;
  courseNumber: string;
  courseName: string;
  semester: string;
  selectedTA: string | null;
  hoursPerWeek: number;
}

interface BatchTAAssignmentProps {
  missingAssignments: Array<{
    courseOfferingId: string;
    courseNumber: string;
    courseName: string;
    semester: string;
  }>;
  availableTAs: Array<{
    id: string;
    firstName: string;
    lastName: string;
    currentHours: number;
    maxHours: number;
  }>;
  onComplete: () => void;
}

export function BatchTAAssignment({
  missingAssignments,
  availableTAs,
  onComplete,
}: BatchTAAssignmentProps) {
  const [assignments, setAssignments] = useState<BatchAssignment[]>(
    missingAssignments.map(course => ({
      ...course,
      selectedTA: null,
      hoursPerWeek: 10,
    }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const { assignTA } = useTAAssignments();

  const updateAssignment = (index: number, updates: Partial<BatchAssignment>) => {
    setAssignments(prev => {
      const newAssignments = [...prev];
      newAssignments[index] = { ...newAssignments[index], ...updates };
      return newAssignments;
    });
  };

  const calculateTAWorkload = (taId: string) => {
    const baseHours = availableTAs.find(ta => ta.id === taId)?.currentHours || 0;
    const additionalHours = assignments
      .filter(a => a.selectedTA === taId)
      .reduce((sum, a) => sum + a.hoursPerWeek, 0);
    return baseHours + additionalHours;
  };

  const validateAssignments = () => {
    const errors: string[] = [];

    // Check if all courses have TAs assigned
    const unassignedCourses = assignments.filter(a => !a.selectedTA);
    if (unassignedCourses.length > 0) {
      errors.push(`${unassignedCourses.length} courses have no TA assigned`);
    }

    // Check TA workload limits
    const taWorkloads = new Map<string, number>();
    availableTAs.forEach(ta => {
      taWorkloads.set(ta.id, ta.currentHours);
    });

    assignments.forEach(assignment => {
      if (assignment.selectedTA) {
        const currentLoad = taWorkloads.get(assignment.selectedTA) || 0;
        taWorkloads.set(assignment.selectedTA, currentLoad + assignment.hoursPerWeek);
      }
    });

    const overloadedTAs = Array.from(taWorkloads.entries()).filter(
      ([taId, hours]) => {
        const ta = availableTAs.find(t => t.id === taId);
        return ta && hours > ta.maxHours;
      }
    );

    if (overloadedTAs.length > 0) {
      overloadedTAs.forEach(([taId, hours]) => {
        const ta = availableTAs.find(t => t.id === taId);
        if (ta) {
          errors.push(
            `${ta.firstName} ${ta.lastName} would have ${hours}h/week (max: ${ta.maxHours}h)`
          );
        }
      });
    }

    return errors;
  };

  const handleBatchAssign = async () => {
    const validationErrors = validateAssignments();
    if (validationErrors.length > 0) {
      setError(validationErrors.join('; '));
      return;
    }

    setLoading(true);
    setError(null);
    setProgress({ current: 0, total: assignments.filter(a => a.selectedTA).length });

    try {
      const assignmentsToProcess = assignments.filter(a => a.selectedTA);
      
      for (let i = 0; i < assignmentsToProcess.length; i++) {
        const assignment = assignmentsToProcess[i];
        
        await assignTA({
          courseOfferingId: assignment.courseOfferingId,
          userId: assignment.selectedTA!,
          hoursPerWeek: assignment.hoursPerWeek,
        });

        setProgress({ current: i + 1, total: assignmentsToProcess.length });
      }

      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to complete batch assignment');
    } finally {
      setLoading(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const autoAssign = () => {
    const updatedAssignments = [...assignments];
    const taAssignmentCounts = new Map<string, number>();

    // Initialize counts
    availableTAs.forEach(ta => {
      taAssignmentCounts.set(ta.id, 0);
    });

    // Sort TAs by available hours (most available first)
    const sortedTAs = [...availableTAs].sort((a, b) => {
      const aAvailable = a.maxHours - a.currentHours;
      const bAvailable = b.maxHours - b.currentHours;
      return bAvailable - aAvailable;
    });

    // Assign TAs to courses
    updatedAssignments.forEach((assignment, index) => {
      if (!assignment.selectedTA) {
        // Find TA with most available hours and fewest new assignments
        const eligibleTA = sortedTAs.find(ta => {
          const currentLoad = ta.currentHours;
          const newAssignments = taAssignmentCounts.get(ta.id) || 0;
          const projectedHours = currentLoad + (newAssignments * 10) + assignment.hoursPerWeek;
          return projectedHours <= ta.maxHours;
        });

        if (eligibleTA) {
          updatedAssignments[index].selectedTA = eligibleTA.id;
          taAssignmentCounts.set(
            eligibleTA.id,
            (taAssignmentCounts.get(eligibleTA.id) || 0) + 1
          );
        }
      }
    });

    setAssignments(updatedAssignments);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Batch TA Assignment</h3>
        <Button
          variant="secondary"
          onClick={autoAssign}
          disabled={loading}
        >
          Auto-Assign TAs
        </Button>
      </div>

      {error && <ErrorMessage message={error} />}

      {progress.total > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span>Processing assignments...</span>
            <span>{progress.current} / {progress.total}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {assignments.map((assignment, index) => {
          const selectedTA = availableTAs.find(ta => ta.id === assignment.selectedTA);
          const projectedHours = selectedTA
            ? calculateTAWorkload(selectedTA.id)
            : 0;
          const isOverloaded = selectedTA && projectedHours > selectedTA.maxHours;

          return (
            <div
              key={assignment.courseOfferingId}
              className={`border rounded-lg p-4 ${
                isOverloaded ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">
                    {assignment.courseNumber}: {assignment.courseName}
                  </h4>
                  <p className="text-sm text-gray-500">{assignment.semester}</p>
                </div>
                
                <div className="flex items-center space-x-3">
                  <select
                    value={assignment.selectedTA || ''}
                    onChange={(e) => updateAssignment(index, { selectedTA: e.target.value })}
                    className={`text-sm rounded-md ${
                      isOverloaded ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={loading}
                  >
                    <option value="">Select TA</option>
                    {availableTAs.map(ta => {
                      const workload = calculateTAWorkload(ta.id);
                      const wouldOverload = workload > ta.maxHours;
                      
                      return (
                        <option
                          key={ta.id}
                          value={ta.id}
                          disabled={wouldOverload && ta.id !== assignment.selectedTA}
                        >
                          {ta.firstName} {ta.lastName} ({workload}/{ta.maxHours}h)
                        </option>
                      );
                    })}
                  </select>
                  
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={assignment.hoursPerWeek}
                    onChange={(e) => updateAssignment(index, {
                      hoursPerWeek: parseInt(e.target.value) || 10
                    })}
                    className="w-16 text-sm rounded-md border-gray-300"
                    disabled={loading}
                  />
                  <span className="text-sm text-gray-500">h/week</span>
                </div>
              </div>
              
              {isOverloaded && (
                <p className="mt-2 text-xs text-red-600">
                  Warning: This assignment would exceed the TA's maximum hours
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-sm text-gray-600">
          {assignments.filter(a => a.selectedTA).length} of {assignments.length} courses assigned
        </div>
        <Button
          onClick={handleBatchAssign}
          disabled={loading || assignments.filter(a => a.selectedTA).length === 0}
        >
          {loading ? <LoadingSpinner size="sm" /> : 'Assign All'}
        </Button>
      </div>
    </div>
  );
}