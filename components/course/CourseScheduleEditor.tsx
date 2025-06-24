'use client';

import { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { SerifHeading, BodyText } from '../ui/Typography';
import { ErrorMessage } from '../ui/ErrorMessage';
import { clsx } from 'clsx';

interface CourseOffering {
  id?: string;
  semester: 'Spring' | 'Summer' | 'Fall';
  year: number;
  startDate: string;
  endDate: string;
  schedule: string;
  maxEnrollment: number;
  requiredTAs: number;
}

interface CourseScheduleEditorProps {
  courseCode: string;
  courseName: string;
  offerings: CourseOffering[];
  onSave: (offerings: CourseOffering[]) => Promise<void>;
  onCancel: () => void;
  className?: string;
}

export function CourseScheduleEditor({
  courseCode,
  courseName,
  offerings: initialOfferings,
  onSave,
  onCancel,
  className
}: CourseScheduleEditorProps) {
  const [offerings, setOfferings] = useState<CourseOffering[]>(initialOfferings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i);

  const addOffering = () => {
    const newOffering: CourseOffering = {
      semester: 'Fall',
      year: currentYear,
      startDate: '',
      endDate: '',
      schedule: '',
      maxEnrollment: 30,
      requiredTAs: 1
    };
    setOfferings([...offerings, newOffering]);
  };

  const updateOffering = (index: number, updates: Partial<CourseOffering>) => {
    const updated = [...offerings];
    updated[index] = { ...updated[index], ...updates };
    setOfferings(updated);
  };

  const removeOffering = (index: number) => {
    setOfferings(offerings.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Validate offerings
      for (const offering of offerings) {
        if (!offering.startDate || !offering.endDate) {
          throw new Error('All offerings must have start and end dates');
        }
        if (!offering.schedule) {
          throw new Error('All offerings must have a schedule');
        }
        if (offering.maxEnrollment < 1) {
          throw new Error('Max enrollment must be at least 1');
        }
        if (offering.requiredTAs < 0) {
          throw new Error('Required TAs cannot be negative');
        }
      }

      await onSave(offerings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save offerings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={clsx('space-y-6', className)}>
      <div>
        <SerifHeading className="text-2xl mb-2">
          Edit Course Schedule
        </SerifHeading>
        <BodyText className="text-gray-600">
          {courseCode} - {courseName}
        </BodyText>
      </div>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <div className="space-y-4">
        {offerings.map((offering, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">
                  {offering.semester} {offering.year}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOffering(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex gap-2">
                  <select
                    value={offering.semester}
                    onChange={(e) => updateOffering(index, { 
                      semester: e.target.value as CourseOffering['semester'] 
                    })}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-charcoal"
                  >
                    <option value="Spring">Spring</option>
                    <option value="Summer">Summer</option>
                    <option value="Fall">Fall</option>
                  </select>
                  
                  <select
                    value={offering.year}
                    onChange={(e) => updateOffering(index, { 
                      year: parseInt(e.target.value) 
                    })}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-charcoal"
                  >
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <Input
                  type="text"
                  label="Schedule (e.g., MWF 10:00-11:00)"
                  value={offering.schedule}
                  onChange={(e) => updateOffering(index, { schedule: e.target.value })}
                  placeholder="MWF 10:00-11:00"
                />

                <Input
                  type="date"
                  label="Start Date"
                  value={offering.startDate}
                  onChange={(e) => updateOffering(index, { startDate: e.target.value })}
                />

                <Input
                  type="date"
                  label="End Date"
                  value={offering.endDate}
                  onChange={(e) => updateOffering(index, { endDate: e.target.value })}
                />

                <Input
                  type="number"
                  label="Max Enrollment"
                  value={offering.maxEnrollment}
                  onChange={(e) => updateOffering(index, { 
                    maxEnrollment: parseInt(e.target.value) || 0 
                  })}
                  min={1}
                />

                <Input
                  type="number"
                  label="Required TAs"
                  value={offering.requiredTAs}
                  onChange={(e) => updateOffering(index, { 
                    requiredTAs: parseInt(e.target.value) || 0 
                  })}
                  min={0}
                />
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Button
        variant="secondary"
        onClick={addOffering}
        className="w-full md:w-auto"
      >
        Add Another Offering
      </Button>

      <div className="flex gap-3 justify-end pt-4 border-t">
        <Button
          variant="ghost"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={saving || offerings.length === 0}
        >
          {saving ? 'Saving...' : 'Save Schedule'}
        </Button>
      </div>
    </div>
  );
}