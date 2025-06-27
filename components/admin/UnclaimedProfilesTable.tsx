"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';

interface UnclaimedProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  gradYear: number | null;
  degreeProgram: string | null;
  location: string | null;
  createdAt: Date;
  recordedBy: string | null;
  recordedAt: Date | null;
  invitationSent: Date | null;
  assignments: Array<{
    id: string;
    courseOfferingId: string;
    hoursPerWeek: number | null;
    courseNumber: string;
    courseName: string;
    semester: string;
    year: number;
    season: string;
    professorName: string | null;
  }>;
  invitationStatus: {
    hasPendingInvitation: boolean;
    lastInvitedAt: Date | null;
    invitationExpiresAt: Date | null;
  };
  recorder: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

interface UnclaimedProfilesTableProps {
  profiles: UnclaimedProfile[];
  selectedProfiles: Set<string>;
  onSelectAll: (checked: boolean) => void;
  onSelectProfile: (profileId: string, checked: boolean) => void;
  onSendInvitation: (profileId: string, personalMessage?: string) => Promise<void>;
  onViewHistory: (profileId: string) => void;
}

export function UnclaimedProfilesTable({
  profiles,
  selectedProfiles,
  onSelectAll,
  onSelectProfile,
  onSendInvitation,
  onViewHistory,
}: UnclaimedProfilesTableProps) {
  const [sendingInvitation, setSendingInvitation] = useState<string | null>(null);
  const [showMessageModal, setShowMessageModal] = useState<string | null>(null);
  const [personalMessage, setPersonalMessage] = useState('');

  const handleSendInvitation = async (profileId: string) => {
    setSendingInvitation(profileId);
    try {
      await onSendInvitation(profileId, personalMessage);
      setShowMessageModal(null);
      setPersonalMessage('');
    } finally {
      setSendingInvitation(null);
    }
  };

  const getInvitationStatus = (profile: UnclaimedProfile) => {
    if (profile.invitationStatus.hasPendingInvitation) {
      return {
        label: 'Sent',
        className: 'text-green-600 bg-green-50',
        expires: profile.invitationStatus.invitationExpiresAt,
      };
    }
    if (profile.invitationStatus.lastInvitedAt) {
      return {
        label: 'Expired',
        className: 'text-red-600 bg-red-50',
        lastSent: profile.invitationStatus.lastInvitedAt,
      };
    }
    return {
      label: 'Never Sent',
      className: 'text-charcoal/60 bg-gray-50',
    };
  };

  const formatCourses = (assignments: UnclaimedProfile['assignments']) => {
    if (assignments.length === 0) return 'No courses recorded';
    
    return assignments
      .map(a => `${a.courseNumber} (${a.season} ${a.year})`)
      .join(', ');
  };

  const allSelected = profiles.length > 0 && profiles.every(p => selectedProfiles.has(p.id));
  const someSelected = profiles.some(p => selectedProfiles.has(p.id));
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = someSelected && !allSelected;
    }
  }, [someSelected, allSelected]);

  return (
    <>
      <div className="overflow-x-auto border border-charcoal/20">
        <table className="min-w-full divide-y divide-charcoal/10">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  ref={checkboxRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="h-4 w-4 text-charcoal border-charcoal/20 rounded focus:ring-charcoal"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-charcoal/60 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-charcoal/60 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-charcoal/60 uppercase tracking-wider">
                Courses
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-charcoal/60 uppercase tracking-wider">
                Recorded By
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-charcoal/60 uppercase tracking-wider">
                Invitation Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-charcoal/60 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-charcoal/10">
            {profiles.map((profile) => {
              const status = getInvitationStatus(profile);
              
              return (
                <tr key={profile.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedProfiles.has(profile.id)}
                      onChange={(e) => onSelectProfile(profile.id, e.target.checked)}
                      className="h-4 w-4 text-charcoal border-charcoal/20 rounded focus:ring-charcoal"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-charcoal">
                        {profile.firstName} {profile.lastName}
                      </div>
                      {profile.gradYear && (
                        <div className="text-sm text-charcoal/60">
                          Class of {profile.gradYear}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-charcoal">
                    {profile.email}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-charcoal">
                      {formatCourses(profile.assignments)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      {profile.recorder ? (
                        <>
                          <div className="text-charcoal">
                            {profile.recorder.firstName} {profile.recorder.lastName}
                          </div>
                          {profile.recordedAt && (
                            <div className="text-charcoal/60">
                              {format(new Date(profile.recordedAt), 'MMM d, yyyy')}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-charcoal/40">Unknown</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                        {status.label}
                      </span>
                      {status.expires && (
                        <span className="text-xs text-charcoal/60">
                          Expires {format(new Date(status.expires), 'MMM d')}
                        </span>
                      )}
                      {status.lastSent && (
                        <span className="text-xs text-charcoal/60">
                          Last sent {format(new Date(status.lastSent), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {!profile.invitationStatus.hasPendingInvitation ? (
                        <Button
                          size="sm"
                          onClick={() => setShowMessageModal(profile.id)}
                          disabled={sendingInvitation === profile.id}
                        >
                          {sendingInvitation === profile.id ? 'Sending...' : 
                           profile.invitationStatus.lastInvitedAt ? 'Resend' : 'Send Invitation'}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onViewHistory(profile.id)}
                        >
                          View Details
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Personal message modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 max-w-md w-full mx-4 border border-charcoal/20">
            <h3 className="text-lg font-serif mb-4">Send Invitation</h3>
            <p className="text-sm text-charcoal/60 mb-4">
              Optionally include a personal message with the invitation.
            </p>
            <textarea
              value={personalMessage}
              onChange={(e) => setPersonalMessage(e.target.value)}
              placeholder="Add a personal message (optional)..."
              className="w-full p-3 border border-charcoal/20 h-32 resize-none"
              maxLength={500}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowMessageModal(null);
                  setPersonalMessage('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleSendInvitation(showMessageModal)}
                disabled={sendingInvitation === showMessageModal}
              >
                {sendingInvitation === showMessageModal ? 'Sending...' : 'Send Invitation'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}