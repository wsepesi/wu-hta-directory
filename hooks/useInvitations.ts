import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { 
  Invitation,
  InvitationWithRelations,
  CreateInvitationInput,
  ApiResponse
} from '@/lib/types';

interface UseInvitationsReturn {
  invitations: InvitationWithRelations[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useInvitations = (): UseInvitationsReturn => {
  const [invitations, setInvitations] = useState<InvitationWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvitations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<InvitationWithRelations[]>('/invitations');

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setInvitations(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch invitations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  return {
    invitations,
    loading,
    error,
    refetch: fetchInvitations,
  };
};

interface UseSendInvitationReturn {
  sendInvitation: (data: CreateInvitationInput) => Promise<ApiResponse<Invitation>>;
  loading: boolean;
  error: string | null;
  success: boolean;
  reset: () => void;
}

export const useSendInvitation = (): UseSendInvitationReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const sendInvitation = useCallback(async (data: CreateInvitationInput): Promise<ApiResponse<Invitation>> => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await apiClient.post<Invitation>('/invitations', data);
      
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setSuccess(true);
      }
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send invitation';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  return {
    sendInvitation,
    loading,
    error,
    success,
    reset,
  };
};

interface UseInvitationReturn {
  invitation: InvitationWithRelations | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  revokeInvitation: () => Promise<ApiResponse<void>>;
}

export const useInvitation = (invitationId: string): UseInvitationReturn => {
  const [invitation, setInvitation] = useState<InvitationWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvitation = useCallback(async () => {
    if (!invitationId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<InvitationWithRelations>(`/invitations/${invitationId}`);

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setInvitation(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch invitation');
    } finally {
      setLoading(false);
    }
  }, [invitationId]);

  const revokeInvitation = useCallback(async (): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<void>(`/invitations/${invitationId}`);
    
    if (!response.error) {
      // Clear the local state on successful revocation
      setInvitation(null);
    }
    
    return response;
  }, [invitationId]);

  useEffect(() => {
    fetchInvitation();
  }, [fetchInvitation]);

  return {
    invitation,
    loading,
    error,
    refetch: fetchInvitation,
    revokeInvitation,
  };
};

// Helper hook for checking if an invitation token is valid
interface UseValidateInvitationReturn {
  valid: boolean | null;
  loading: boolean;
  error: string | null;
  invitation: Invitation | null;
}

export const useValidateInvitation = (token: string): UseValidateInvitationReturn => {
  const [valid, setValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<Invitation | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setValid(false);
      return;
    }

    const validateToken = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.get<Invitation>(`/invitations/validate/${token}`);

        if (response.error) {
          setError(response.error);
          setValid(false);
        } else if (response.data) {
          setInvitation(response.data);
          setValid(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to validate invitation');
        setValid(false);
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  return {
    valid,
    loading,
    error,
    invitation,
  };
};

// Helper hook for pending invitations count
export const usePendingInvitationsCount = () => {
  const { invitations, loading, error } = useInvitations();
  
  const pendingCount = invitations.filter(inv => !inv.usedAt).length;
  
  return {
    pendingCount,
    loading,
    error,
  };
};