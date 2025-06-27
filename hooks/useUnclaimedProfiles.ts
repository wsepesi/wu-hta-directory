import { useState, useEffect } from 'react';
import { toast } from '@/hooks/useToast';

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

export function useUnclaimedProfiles(searchQuery?: string) {
  const [profiles, setProfiles] = useState<UnclaimedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = async () => {
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
  };

  useEffect(() => {
    fetchProfiles();
  }, [searchQuery]);

  const sendInvitation = async (profileId: string, personalMessage?: string) => {
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
      throw err;
    }
  };

  const sendBulkInvitations = async (profileIds: string[], personalMessage?: string) => {
    try {
      const response = await fetch('/api/users/unclaimed/send-bulk-invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileIds,
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

      await fetchProfiles();
      return result.data;
    } catch (err) {
      toast.error('Failed to send bulk invitations');
      throw err;
    }
  };

  return {
    profiles,
    loading,
    error,
    refetch: fetchProfiles,
    sendInvitation,
    sendBulkInvitations,
  };
}