"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { toast } from '@/hooks/useToast';
import { UnclaimedProfilesTable } from '@/components/admin/UnclaimedProfilesTable';
import { BulkInvitationModal } from '@/components/admin/BulkInvitationModal';
import { InvitationHistoryModal } from '@/components/admin/InvitationHistoryModal';

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

export default function UnclaimedProfilesPage() {
  const [profiles, setProfiles] = useState<UnclaimedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfiles, setSelectedProfiles] = useState<Set<string>>(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedProfileForHistory, setSelectedProfileForHistory] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'never_sent' | 'sent' | 'expired'>('all');

  // Fetch unclaimed profiles
  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      const params = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
      const response = await fetch(`/api/users/unclaimed${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch unclaimed profiles');
      }
      
      const data = await response.json();
      setProfiles(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Failed to load profiles');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // Filter profiles based on status
  const filteredProfiles = useMemo(() => {
    return profiles.filter(profile => {
      switch (statusFilter) {
        case 'never_sent':
          return !profile.invitationSent && !profile.invitationStatus.hasPendingInvitation;
        case 'sent':
          return profile.invitationStatus.hasPendingInvitation;
        case 'expired':
          return profile.invitationStatus.lastInvitedAt && 
                 !profile.invitationStatus.hasPendingInvitation;
        default:
          return true;
      }
    });
  }, [profiles, statusFilter]);

  // Handle individual invitation
  const handleSendInvitation = async (profileId: string, personalMessage?: string) => {
    try {
      const response = await fetch(`/api/users/${profileId}/send-claim-invitation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personalMessage }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send invitation');
      }

      toast.success('Invitation sent successfully');
      await fetchProfiles();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send invitation');
    }
  };

  // Handle bulk invitations
  const handleBulkInvitations = async (personalMessage?: string) => {
    if (selectedProfiles.size === 0) {
      toast.warning('No profiles selected');
      return;
    }

    try {
      const response = await fetch('/api/users/unclaimed/send-bulk-invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileIds: Array.from(selectedProfiles),
          personalMessage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send bulk invitations');
      }

      const result = await response.json();
      const { sent, failed } = result.data;

      if (sent > 0) {
        toast.success(`Successfully sent ${sent} invitation${sent > 1 ? 's' : ''}`);
      }
      if (failed > 0) {
        toast.error(`Failed to send ${failed} invitation${failed > 1 ? 's' : ''}`);
      }

      setSelectedProfiles(new Set());
      setShowBulkModal(false);
      await fetchProfiles();
    } catch (err) {
      console.error('Error sending bulk invitations:', err);
      toast.error('Failed to send bulk invitations');
    }
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProfiles(new Set(filteredProfiles.map(p => p.id)));
    } else {
      setSelectedProfiles(new Set());
    }
  };

  // Handle individual selection
  const handleSelectProfile = (profileId: string, checked: boolean) => {
    const newSelected = new Set(selectedProfiles);
    if (checked) {
      newSelected.add(profileId);
    } else {
      newSelected.delete(profileId);
    }
    setSelectedProfiles(newSelected);
  };

  if (loading && profiles.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-serif mb-6">Unclaimed Profiles Management</h1>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-serif mb-6">Unclaimed Profiles Management</h1>
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-serif mb-2">Unclaimed Profiles Management</h1>
        <p className="text-charcoal/60">
          Manage and send invitations to unclaimed TA profiles
        </p>
      </div>

      <div className="mb-6 space-y-4">
        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            type="search"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'never_sent' | 'sent' | 'expired')}
            className="px-3 py-2 border border-charcoal/20 bg-white"
          >
            <option value="all">All Profiles</option>
            <option value="never_sent">Never Invited</option>
            <option value="sent">Invitation Sent</option>
            <option value="expired">Invitation Expired</option>
          </select>
        </div>

        {/* Bulk actions */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-charcoal/60">
            {selectedProfiles.size > 0 && (
              <span>{selectedProfiles.size} profile{selectedProfiles.size > 1 ? 's' : ''} selected</span>
            )}
          </div>
          
          <div className="flex gap-2">
            {selectedProfiles.size > 0 && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => setSelectedProfiles(new Set())}
                >
                  Clear Selection
                </Button>
                <Button
                  onClick={() => setShowBulkModal(true)}
                >
                  Send Bulk Invitations ({selectedProfiles.size})
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Profiles table */}
      <UnclaimedProfilesTable
        profiles={filteredProfiles}
        selectedProfiles={selectedProfiles}
        onSelectAll={handleSelectAll}
        onSelectProfile={handleSelectProfile}
        onSendInvitation={handleSendInvitation}
        onViewHistory={(profileId) => {
          setSelectedProfileForHistory(profileId);
          setShowHistoryModal(true);
        }}
      />

      {/* Stats summary */}
      <div className="mt-6 p-4 bg-gray-50 border border-charcoal/10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-charcoal/60">Total Profiles:</span>
            <span className="ml-2 font-medium">{profiles.length}</span>
          </div>
          <div>
            <span className="text-charcoal/60">Never Invited:</span>
            <span className="ml-2 font-medium">
              {profiles.filter(p => !p.invitationSent && !p.invitationStatus.hasPendingInvitation).length}
            </span>
          </div>
          <div>
            <span className="text-charcoal/60">Active Invitations:</span>
            <span className="ml-2 font-medium">
              {profiles.filter(p => p.invitationStatus.hasPendingInvitation).length}
            </span>
          </div>
          <div>
            <span className="text-charcoal/60">Expired Invitations:</span>
            <span className="ml-2 font-medium">
              {profiles.filter(p => p.invitationStatus.lastInvitedAt && !p.invitationStatus.hasPendingInvitation).length}
            </span>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showBulkModal && (
        <BulkInvitationModal
          profileCount={selectedProfiles.size}
          onConfirm={handleBulkInvitations}
          onCancel={() => setShowBulkModal(false)}
        />
      )}

      {showHistoryModal && selectedProfileForHistory && (
        <InvitationHistoryModal
          profileId={selectedProfileForHistory}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedProfileForHistory(null);
          }}
        />
      )}
    </div>
  );
}