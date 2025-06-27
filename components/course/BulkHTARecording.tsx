'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useHTARecords } from '@/hooks/useHTARecords';

interface BulkRecord {
  courseOfferingId: string;
  courseNumber: string;
  courseName: string;
  semester: string;
  selectedHTA: string | null;
  hoursPerWeek: number;
}

interface BulkHeadTARecordingProps {
  missingRecords: Array<{
    courseOfferingId: string;
    courseNumber: string;
    courseName: string;
    semester: string;
  }>;
  availableHTAs: Array<{
    id: string;
    firstName: string;
    lastName: string;
    currentHours: number;
    maxHours: number;
  }>;
  onComplete: () => void;
}

export function BulkHeadTARecording({
  missingRecords,
  availableHTAs,
  onComplete,
}: BulkHeadTARecordingProps) {
  const [records, setRecords] = useState<BulkRecord[]>(
    missingRecords.map(course => ({
      ...course,
      selectedHTA: null,
      hoursPerWeek: 10,
    }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const { recordHeadTA } = useHTARecords();

  const updateRecord = (index: number, updates: Partial<BulkRecord>) => {
    setRecords(prev => {
      const newRecords = [...prev];
      newRecords[index] = { ...newRecords[index], ...updates };
      return newRecords;
    });
  };

  const calculateHTAWorkload = (htaId: string) => {
    const baseHours = availableHTAs.find(hta => hta.id === htaId)?.currentHours || 0;
    const additionalHours = records
      .filter(r => r.selectedHTA === htaId)
      .reduce((sum, r) => sum + r.hoursPerWeek, 0);
    return baseHours + additionalHours;
  };

  const validateRecords = () => {
    const errors: string[] = [];

    // Check if all courses have HTAs recorded
    const unrecordedCourses = records.filter(r => !r.selectedHTA);
    if (unrecordedCourses.length > 0) {
      errors.push(`${unrecordedCourses.length} courses have no HTA recorded`);
    }

    // Check HTA workload limits
    const htaWorkloads = new Map<string, number>();
    availableHTAs.forEach(hta => {
      htaWorkloads.set(hta.id, hta.currentHours);
    });

    records.forEach(record => {
      if (record.selectedHTA) {
        const currentLoad = htaWorkloads.get(record.selectedHTA) || 0;
        htaWorkloads.set(record.selectedHTA, currentLoad + record.hoursPerWeek);
      }
    });

    const overloadedHTAs = Array.from(htaWorkloads.entries()).filter(
      ([htaId, hours]) => {
        const hta = availableHTAs.find(h => h.id === htaId);
        return hta && hours > hta.maxHours;
      }
    );

    if (overloadedHTAs.length > 0) {
      overloadedHTAs.forEach(([htaId, hours]) => {
        const hta = availableHTAs.find(h => h.id === htaId);
        if (hta) {
          errors.push(
            `${hta.firstName} ${hta.lastName} would have ${hours}h/week (max: ${hta.maxHours}h)`
          );
        }
      });
    }

    return errors;
  };

  const handleBulkRecord = async () => {
    const validationErrors = validateRecords();
    if (validationErrors.length > 0) {
      setError(validationErrors.join('; '));
      return;
    }

    setLoading(true);
    setError(null);
    setProgress({ current: 0, total: records.filter(r => r.selectedHTA).length });

    try {
      const recordsToProcess = records.filter(r => r.selectedHTA);
      
      for (let i = 0; i < recordsToProcess.length; i++) {
        const record = recordsToProcess[i];
        
        await recordHeadTA({
          courseOfferingId: record.courseOfferingId,
          userId: record.selectedHTA!,
          hoursPerWeek: record.hoursPerWeek,
        });

        setProgress({ current: i + 1, total: recordsToProcess.length });
      }

      onComplete();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to complete bulk recording');
    } finally {
      setLoading(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const autoRecord = () => {
    const updatedRecords = [...records];
    const htaRecordCounts = new Map<string, number>();

    // Initialize counts
    availableHTAs.forEach(hta => {
      htaRecordCounts.set(hta.id, 0);
    });

    // Sort HTAs by available hours (most available first)
    const sortedHTAs = [...availableHTAs].sort((a, b) => {
      const aAvailable = a.maxHours - a.currentHours;
      const bAvailable = b.maxHours - b.currentHours;
      return bAvailable - aAvailable;
    });

    // Record HTAs to courses
    updatedRecords.forEach((record, index) => {
      if (!record.selectedHTA) {
        // Find HTA with most available hours and fewest new records
        const eligibleHTA = sortedHTAs.find(hta => {
          const currentLoad = hta.currentHours;
          const newRecords = htaRecordCounts.get(hta.id) || 0;
          const projectedHours = currentLoad + (newRecords * 10) + record.hoursPerWeek;
          return projectedHours <= hta.maxHours;
        });

        if (eligibleHTA) {
          updatedRecords[index].selectedHTA = eligibleHTA.id;
          htaRecordCounts.set(
            eligibleHTA.id,
            (htaRecordCounts.get(eligibleHTA.id) || 0) + 1
          );
        }
      }
    });

    setRecords(updatedRecords);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Bulk HTA Recording</h3>
        <Button
          variant="secondary"
          onClick={autoRecord}
          disabled={loading}
        >
          Auto-Record HTAs
        </Button>
      </div>

      {error && <ErrorMessage message={error} />}

      {progress.total > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span>Processing records...</span>
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
        {records.map((record, index) => {
          const selectedHTA = availableHTAs.find(hta => hta.id === record.selectedHTA);
          const projectedHours = selectedHTA
            ? calculateHTAWorkload(selectedHTA.id)
            : 0;
          const isOverloaded = selectedHTA && projectedHours > selectedHTA.maxHours;

          return (
            <div
              key={record.courseOfferingId}
              className={`border rounded-lg p-4 ${
                isOverloaded ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">
                    {record.courseNumber}: {record.courseName}
                  </h4>
                  <p className="text-sm text-gray-500">{record.semester}</p>
                </div>
                
                <div className="flex items-center space-x-3">
                  <select
                    value={record.selectedHTA || ''}
                    onChange={(e) => updateRecord(index, { selectedHTA: e.target.value })}
                    className={`text-sm rounded-md ${
                      isOverloaded ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={loading}
                  >
                    <option value="">Select HTA</option>
                    {availableHTAs.map(hta => {
                      const workload = calculateHTAWorkload(hta.id);
                      const wouldOverload = workload > hta.maxHours;
                      
                      return (
                        <option
                          key={hta.id}
                          value={hta.id}
                          disabled={wouldOverload && hta.id !== record.selectedHTA}
                        >
                          {hta.firstName} {hta.lastName} ({workload}/{hta.maxHours}h)
                        </option>
                      );
                    })}
                  </select>
                  
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={record.hoursPerWeek}
                    onChange={(e) => updateRecord(index, {
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
                  Warning: This record would exceed the HTA&apos;s maximum hours
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-sm text-gray-600">
          {records.filter(r => r.selectedHTA).length} of {records.length} courses recorded
        </div>
        <Button
          onClick={handleBulkRecord}
          disabled={loading || records.filter(r => r.selectedHTA).length === 0}
        >
          {loading ? 'Recording...' : 'Record All'}
        </Button>
      </div>
    </div>
  );
}