'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTAAssignments } from '@/hooks/useTAAssignments';
import { useUsers } from '@/hooks/useUsers';

interface TAAssignmentModalProps {
  courseOfferingId: string;
  courseNumber: string;
  courseName: string;
  semester: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface TASuggestion {
  userId: string;
  userName: string;
  score: number;
  reasons: string[];
  suggestedHours: number;
  currentHours: number;
  maxHours: number;
}

export function TAAssignmentModal({
  courseOfferingId,
  courseNumber,
  courseName,
  semester,
  isOpen,
  onClose,
  onSuccess,
}: TAAssignmentModalProps) {
  const [selectedTA, setSelectedTA] = useState<string>('');
  const [hoursPerWeek, setHoursPerWeek] = useState<number>(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<TASuggestion[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const { assignTA, getSuggestions } = useTAAssignments();
  const { searchUsers } = useUsers();

  useEffect(() => {
    if (isOpen) {
      loadSuggestions();
    }
  }, [isOpen]);

  const loadSuggestions = async () => {
    try {
      const suggestedTAs = await getSuggestions(courseOfferingId);
      setSuggestions(suggestedTAs);
    } catch (err) {
      console.error('Failed to load suggestions:', err);
    }
  };

  const searchTAs = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const results = await searchUsers(query, 'head_ta');
      // Convert search results to suggestions format
      const taSearchResults = results.map(user => ({
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        score: 0,
        reasons: ['Search result'],
        suggestedHours: 10,
        currentHours: 0,
        maxHours: 20,
      }));
      setSuggestions(taSearchResults);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const validateAssignment = () => {
    if (!selectedTA) {
      setValidationError('Please select a TA');
      return false;
    }

    if (hoursPerWeek < 1 || hoursPerWeek > 20) {
      setValidationError('Hours per week must be between 1 and 20');
      return false;
    }

    const selectedSuggestion = suggestions.find(s => s.userId === selectedTA);
    if (selectedSuggestion) {
      const totalHours = selectedSuggestion.currentHours + hoursPerWeek;
      if (totalHours > selectedSuggestion.maxHours) {
        setValidationError(
          `This assignment would exceed the TA's maximum hours (${totalHours}/${selectedSuggestion.maxHours})`
        );
        return false;
      }
    }

    setValidationError(null);
    return true;
  };

  const handleAssign = async () => {
    if (!validateAssignment()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await assignTA({
        courseOfferingId,
        userId: selectedTA,
        hoursPerWeek,
      });
      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to assign TA');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedTA('');
    setHoursPerWeek(10);
    setSearchQuery('');
    setSuggestions([]);
    setError(null);
    setValidationError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Assign Head TA
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {courseNumber}: {courseName} - {semester}
          </p>
        </div>

        <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
          {error && <ErrorMessage message={error} className="mb-4" />}
          {validationError && <ErrorMessage message={validationError} className="mb-4" />}

          {/* Search Bar */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search for TAs
            </label>
            <Input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchTAs(e.target.value);
              }}
              className="w-full"
            />
          </div>

          {/* TA Suggestions */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              {searchQuery ? 'Search Results' : 'Suggested TAs'}
            </h4>
            <div className="space-y-3">
              {suggestions.length === 0 ? (
                <p className="text-sm text-gray-500">
                  {searchQuery ? 'No TAs found' : 'No suggestions available'}
                </p>
              ) : (
                suggestions.map((suggestion) => (
                  <label
                    key={suggestion.userId}
                    className={`
                      block p-4 border rounded-lg cursor-pointer transition-colors
                      ${selectedTA === suggestion.userId
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="ta-selection"
                      value={suggestion.userId}
                      checked={selectedTA === suggestion.userId}
                      onChange={() => setSelectedTA(suggestion.userId)}
                      className="sr-only"
                    />
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {suggestion.userName}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Current workload: {suggestion.currentHours}h/week
                        </p>
                        {suggestion.score > 0 && (
                          <div className="mt-2">
                            <span className="text-xs font-medium text-indigo-600">
                              Match score: {Math.round(suggestion.score)}%
                            </span>
                            <ul className="mt-1 text-xs text-gray-600 space-y-1">
                              {suggestion.reasons.map((reason, idx) => (
                                <li key={idx}>• {reason}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <div className="ml-4 text-right">
                        <span className="text-sm font-medium text-gray-900">
                          {suggestion.suggestedHours}h
                        </span>
                        <p className="text-xs text-gray-500">suggested</p>
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Hours Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hours per week
            </label>
            <Input
              type="number"
              min="1"
              max="20"
              value={hoursPerWeek}
              onChange={(e) => setHoursPerWeek(parseInt(e.target.value) || 10)}
              className="w-32"
            />
            <p className="mt-1 text-xs text-gray-500">
              Between 1 and 20 hours per week
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => {
                onClose();
                resetForm();
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={loading || !selectedTA}
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Assign TA'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}