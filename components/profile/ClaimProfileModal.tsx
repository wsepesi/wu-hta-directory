'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/useToast';
import type { User, Course } from '@/lib/types';

interface ClaimProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  unclaimedProfile: {
    id: string;
    name: string;
    courses: Array<{
      course: Course;
      semester: string;
      role: string;
    }>;
  };
  currentUser: User;
}

export function ClaimProfileModal({
  isOpen,
  onClose,
  unclaimedProfile,
  currentUser,
}: ClaimProfileModalProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleClaim = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/unclaimed-profiles/${unclaimedProfile.id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to claim profile');
      }

      toast.success('Profile claimed successfully! Your assignments have been merged.');
      router.refresh();
      onClose();
    } catch (error) {
      console.error('Error claiming profile:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to claim profile');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-lg shadow-xl max-w-lg w-full pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-charcoal-100">
            <h2 className="text-xl font-serif text-charcoal-900">
              Claim Profile: {unclaimedProfile.name}
            </h2>
            <p className="mt-1 text-sm text-charcoal-600">
              This will merge all course assignments to your profile
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <div className="space-y-4">
              {/* Current Profile */}
              <div>
                <h3 className="text-sm font-medium text-charcoal-700 mb-2">Your Current Profile</h3>
                <div className="p-3 bg-charcoal-50 rounded-md">
                  <p className="font-serif text-charcoal-900">
                    {currentUser.firstName} {currentUser.lastName}
                  </p>
                  <p className="text-sm text-charcoal-600 mt-1">{currentUser.email}</p>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <svg
                  className="w-6 h-6 text-charcoal-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </div>

              {/* Courses to be Merged */}
              <div>
                <h3 className="text-sm font-medium text-charcoal-700 mb-2">
                  Assignments to be Merged
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {unclaimedProfile.courses.length === 0 ? (
                    <p className="text-sm text-charcoal-500 italic">No course assignments</p>
                  ) : (
                    unclaimedProfile.courses.map((assignment, index) => (
                      <div
                        key={index}
                        className="p-3 bg-charcoal-50 rounded-md border border-charcoal-100"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-charcoal-900">
                              {assignment.course.courseNumber}
                            </p>
                            <p className="text-sm text-charcoal-600">{assignment.course.courseName}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-charcoal-700">
                              {assignment.semester}
                            </p>
                            <p className="text-xs text-charcoal-500">{assignment.role}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Warning */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> This action cannot be undone. All assignments from the
                  unclaimed profile will be permanently transferred to your account.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-charcoal-50 rounded-b-lg flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-sm font-medium text-charcoal-700 bg-white border border-charcoal-200 rounded-md hover:bg-charcoal-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleClaim}
              disabled={isProcessing}
              className="px-4 py-2 text-sm font-medium text-white bg-charcoal-800 rounded-md hover:bg-charcoal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? 'Claiming...' : 'Claim Profile'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}