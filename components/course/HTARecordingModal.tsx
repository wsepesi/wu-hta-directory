'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { SearchFormSkeleton } from '@/components/ui/FormSkeleton';
import { useHTARecords } from '@/hooks/useHTARecords';
import { useUserSearch } from '@/hooks/useSearch';
import type { User } from '@/lib/types';

interface HeadTARecordingModalProps {
  courseOfferingId: string;
  courseNumber: string;
  courseName: string;
  semester: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface HeadTASuggestion {
  userId: string;
  userName: string;
  score: number;
  reasons: string[];
  suggestedHours: number;
  currentHours: number;
  maxHours: number;
}

export function HeadTARecordingModal({
  courseOfferingId,
  courseNumber,
  courseName,
  semester,
  isOpen,
  onClose,
  onSuccess,
}: HeadTARecordingModalProps) {
  const [selectedHTA, setSelectedHTA] = useState<string>('');
  const [hoursPerWeek, setHoursPerWeek] = useState<number>(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<HeadTASuggestion[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [sendInvitation, setSendInvitation] = useState(false);

  const { recordHeadTA: recordHTA, getSuggestions } = useHTARecords();
  const { results: searchResults, search } = useUserSearch();

  const loadSuggestions = useCallback(async () => {
    try {
      setInitialLoading(true);
      const existingHeadTAProfiles = await getSuggestions(courseOfferingId);
      setSuggestions(existingHeadTAProfiles);
    } catch (err) {
      console.error('Failed to load suggestions:', err);
    } finally {
      setInitialLoading(false);
    }
  }, [courseOfferingId, getSuggestions]);

  useEffect(() => {
    if (isOpen) {
      loadSuggestions();
    }
  }, [isOpen, loadSuggestions]);

  const searchHTAs = useCallback((query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    search(query);
  }, [search]);

  // Update suggestions when search results change
  useEffect(() => {
    if (searchResults.length > 0) {
      // Convert search results to suggestions format
      const headTASearchResults = searchResults.map((user: User) => ({
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        score: 0,
        reasons: ['Search result'],
        suggestedHours: 10,
        currentHours: 0,
        maxHours: 20,
      }));
      setSuggestions(headTASearchResults);
    }
  }, [searchResults]);

  const validateRecord = () => {
    if (!selectedHTA) {
      setValidationError('Please select an HTA');
      return false;
    }

    // Removed hours validation - not relevant for historical records

    setValidationError(null);
    return true;
  };

  const handleRecord = async () => {
    if (!validateRecord()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await recordHTA({
        courseOfferingId,
        userId: selectedHTA,
        hoursPerWeek,
        autoInvite: sendInvitation,
      });
      onSuccess();
      onClose();
      resetForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record HTA');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedHTA('');
    setHoursPerWeek(10);
    setSearchQuery('');
    setSuggestions([]);
    setError(null);
    setValidationError(null);
    setSendInvitation(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Record Head TA
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {courseNumber}: {courseName} - {semester}
          </p>
        </div>

        <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
          {error && <ErrorMessage message={error} className="mb-4" />}
          {validationError && <ErrorMessage message={validationError} className="mb-4" />}

          {initialLoading ? (
            <SearchFormSkeleton />
          ) : (
            <>
              {/* Search Bar */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search for HTAs
                </label>
                <Input
                  type="text"
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchHTAs(e.target.value);
                  }}
                  className="w-full"
                />
              </div>

              {/* HTA Suggestions */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  {searchQuery ? 'Search Results' : 'Previously Recorded HTAs'}
                </h4>
                <div className="space-y-3">
                  {suggestions.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      {searchQuery ? 'No HTAs found' : 'No previously recorded HTAs'}
                    </p>
                  ) : (
                    suggestions.map((suggestion) => (
                  <label
                    key={suggestion.userId}
                    className={`
                      block p-4 border rounded-lg cursor-pointer transition-colors
                      ${selectedHTA === suggestion.userId
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="hta-selection"
                      value={suggestion.userId}
                      checked={selectedHTA === suggestion.userId}
                      onChange={() => setSelectedHTA(suggestion.userId)}
                      className="sr-only"
                    />
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {suggestion.userName}
                        </p>
                        {/* Removed workload tracking - not relevant for historical records */}
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
                      {/* Removed suggested hours - not relevant for historical records */}
                    </div>
                  </label>
                ))
                    )}
                  </div>
                </div>

                {/* Hours Input - Hidden for historical records */}
                <input type="hidden" value={hoursPerWeek} />

                {/* Send Invitation Checkbox */}
                <div className="mt-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={sendInvitation}
                      onChange={(e) => setSendInvitation(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      Send invitation to claim profile
                    </span>
                  </label>
                  <p className="mt-1 text-xs text-gray-500 ml-6">
                    An email invitation will be sent if the HTA hasn&apos;t claimed their profile yet
                  </p>
                </div>
              </>
            )}
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
              onClick={handleRecord}
              disabled={loading || !selectedHTA}
            >
              {loading ? 'Recording...' : 'Record HTA'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}