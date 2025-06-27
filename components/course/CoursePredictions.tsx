'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { CoursePredictionsSkeleton } from './CourseSkeletons';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import Link from 'next/link';

interface Prediction {
  courseId: string;
  courseNumber: string;
  courseName: string;
  predictedSemester: string;
  predictedYear: number;
  predictedSeason: string;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

export function CoursePredictions() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedSeason, setSelectedSeason] = useState<string>('fall');

  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear + 1, currentYear + 2];
  const seasons = ['Spring', 'Summer', 'Fall'];

  const loadPredictions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/courses/predictions?year=${selectedYear}&season=${selectedSeason.toLowerCase()}`
      );

      if (!response.ok) {
        throw new Error('Failed to load predictions');
      }

      const data = await response.json();
      setPredictions(data.predictions);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load predictions');
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedSeason]);

  useEffect(() => {
    loadPredictions();
  }, [loadPredictions]);

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const createOffering = async (prediction: Prediction) => {
    try {
      const response = await fetch('/api/course-offerings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: prediction.courseId,
          semester: prediction.predictedSemester,
          year: prediction.predictedYear,
          season: prediction.predictedSeason,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create offering');
      }

      // Reload predictions
      await loadPredictions();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create offering');
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Course Predictions</h2>
          
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Season</label>
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {seasons.map(season => (
                  <option key={season} value={season}>{season}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && <ErrorMessage message={error} className="mb-4" />}

        {loading ? (
          <CoursePredictionsSkeleton />
        ) : predictions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No predictions available for this semester
          </p>
        ) : (
          <div className="space-y-4">
            {predictions.map((prediction) => (
              <div
                key={`${prediction.courseId}-${prediction.predictedSemester}`}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <Link
                        href={`/courses/${prediction.courseNumber}`}
                        className="text-base font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        {prediction.courseNumber}: {prediction.courseName}
                      </Link>
                      <span
                        className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getConfidenceColor(
                          prediction.confidence
                        )}`}
                      >
                        {prediction.confidence} confidence
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {prediction.reason}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => createOffering(prediction)}
                    className="ml-4"
                  >
                    Create Offering
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}