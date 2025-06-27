'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { toast } from '@/hooks/useToast';

interface HistoricalAssignment {
  firstName: string;
  lastName: string;
  email?: string;
  courseOfferingId: string;
  hoursPerWeek?: number;
  responsibilities?: string;
  gradYear?: number;
  degreeProgram?: string;
  location?: string;
}

interface BulkHistoricalTAImportProps {
  courseOfferings: Array<{
    id: string;
    courseNumber: string;
    courseName: string;
    semester: string;
  }>;
  onComplete?: () => void;
}

export function BulkHistoricalTAImport({ 
  courseOfferings, 
  onComplete 
}: BulkHistoricalTAImportProps) {
  const [csvContent, setCsvContent] = useState('');
  const [parsedAssignments, setParsedAssignments] = useState<HistoricalAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const parseCsv = useCallback(() => {
    try {
      setError(null);
      setValidationErrors([]);
      
      const lines = csvContent.trim().split('\n');
      if (lines.length < 2) {
        setError('CSV must have a header row and at least one data row');
        return;
      }

      // Parse header
      const header = lines[0].split(',').map(h => h.trim().toLowerCase());
      const requiredFields = ['firstname', 'lastname', 'courseofferingid'];
      const missingFields = requiredFields.filter(field => !header.includes(field));
      
      if (missingFields.length > 0) {
        setError(`Missing required columns: ${missingFields.join(', ')}`);
        return;
      }

      // Parse data rows
      const assignments: HistoricalAssignment[] = [];
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length !== header.length) {
          errors.push(`Row ${i + 1}: Column count mismatch`);
          continue;
        }

        const assignment: HistoricalAssignment = {
          firstName: '',
          lastName: '',
          courseOfferingId: ''
        };

        header.forEach((col, index) => {
          const value = values[index];
          switch (col) {
            case 'firstname':
              assignment.firstName = value;
              break;
            case 'lastname':
              assignment.lastName = value;
              break;
            case 'email':
              assignment.email = value || undefined;
              break;
            case 'courseofferingid':
              assignment.courseOfferingId = value;
              break;
            case 'hoursperweek':
              assignment.hoursPerWeek = value ? parseInt(value, 10) : undefined;
              break;
            case 'responsibilities':
              assignment.responsibilities = value || undefined;
              break;
            case 'gradyear':
              assignment.gradYear = value ? parseInt(value, 10) : undefined;
              break;
            case 'degreeprogram':
              assignment.degreeProgram = value || undefined;
              break;
            case 'location':
              assignment.location = value || undefined;
              break;
          }
        });

        // Validate required fields
        if (!assignment.firstName || !assignment.lastName) {
          errors.push(`Row ${i + 1}: Missing required name`);
          continue;
        }

        if (!assignment.courseOfferingId) {
          errors.push(`Row ${i + 1}: Missing course offering ID`);
          continue;
        }

        // Validate course offering exists
        const courseOffering = courseOfferings.find(co => co.id === assignment.courseOfferingId);
        if (!courseOffering) {
          errors.push(`Row ${i + 1}: Invalid course offering ID: ${assignment.courseOfferingId}`);
          continue;
        }

        assignments.push(assignment);
      }

      setValidationErrors(errors);
      setParsedAssignments(assignments);

      if (assignments.length === 0) {
        setError('No valid assignments found in CSV');
      } else {
        toast.success('CSV Parsed Successfully', {
          message: `Found ${assignments.length} valid assignments${errors.length > 0 ? ` (${errors.length} errors)` : ''}`
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV');
    }
  }, [csvContent, courseOfferings]);

  const handleImport = async () => {
    if (parsedAssignments.length === 0) {
      setError('No assignments to import');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ta-assignments/bulk-historical', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assignments: parsedAssignments }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to import assignments');
      }

      const result = await response.json();
      
      toast.success('Import Successful', {
        message: `Created ${result.data.created} assignments, skipped ${result.data.skipped}`
      });

      if (result.data.errors.length > 0) {
        setValidationErrors(result.data.errors.map((e: { index: number; error: string }) => 
          `Assignment ${e.index + 1}: ${e.error}`
        ));
      }

      // Clear form on success
      setCsvContent('');
      setParsedAssignments([]);
      
      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import assignments');
    } finally {
      setLoading(false);
    }
  };

  const generateTemplate = () => {
    const headers = [
      'firstName',
      'lastName',
      'email',
      'courseOfferingId',
      'hoursPerWeek',
      'responsibilities',
      'gradYear',
      'degreeProgram',
      'location'
    ].join(',');

    const exampleRow = [
      'John',
      'Doe',
      'john.doe@example.com',
      courseOfferings[0]?.id || 'course-offering-id',
      '10',
      'Head TA',
      '2024',
      'Computer Science',
      'St. Louis, MO'
    ].join(',');

    const template = `${headers}\n${exampleRow}`;
    
    // Create download link
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ta-import-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Bulk Historical TA Import</h2>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-2">
            Import historical TA assignments from a CSV file. This will create unclaimed profiles
            for TAs without sending invitation emails.
          </p>
          <Button onClick={generateTemplate} variant="secondary" size="sm">
            Download CSV Template
          </Button>
        </div>

        <div>
          <label htmlFor="csv-input" className="block text-sm font-medium mb-2">
            CSV Content
          </label>
          <textarea
            id="csv-input"
            className="w-full h-64 p-3 border rounded-md font-mono text-sm"
            placeholder="Paste your CSV content here..."
            value={csvContent}
            onChange={(e) => setCsvContent(e.target.value)}
          />
        </div>

        {error && <ErrorMessage message={error} />}

        {validationErrors.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h4 className="font-medium text-yellow-800 mb-2">Validation Warnings:</h4>
            <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
              {validationErrors.map((err, index) => (
                <li key={index}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {parsedAssignments.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-green-800">
              Ready to import <strong>{parsedAssignments.length}</strong> assignments
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={parseCsv}
            disabled={!csvContent.trim() || loading}
            variant="secondary"
          >
            Parse CSV
          </Button>
          
          <Button
            onClick={handleImport}
            disabled={parsedAssignments.length === 0 || loading}
            variant="primary"
          >
            {loading ? 'Importing...' : `Import ${parsedAssignments.length} Assignments`}
          </Button>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h4 className="font-medium mb-2">Available Course Offerings:</h4>
          <div className="max-h-48 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1">Course</th>
                  <th className="text-left py-1">Semester</th>
                  <th className="text-left py-1">ID</th>
                </tr>
              </thead>
              <tbody>
                {courseOfferings.map((co) => (
                  <tr key={co.id} className="border-b">
                    <td className="py-1">{co.courseNumber}: {co.courseName}</td>
                    <td className="py-1">{co.semester}</td>
                    <td className="py-1 font-mono text-xs">{co.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Card>
  );
}