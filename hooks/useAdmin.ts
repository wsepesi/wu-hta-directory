import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { 
  User,
  UserWithInviter,
  AdminStats,
  InvitationTree,
  ApiResponse
} from '@/lib/types';

interface UseAdminUsersReturn {
  users: UserWithInviter[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateUserRole: (userId: string, role: 'head_ta' | 'admin') => Promise<ApiResponse<User>>;
  deleteUser: (userId: string) => Promise<ApiResponse<void>>;
}

export const useAdminUsers = (): UseAdminUsersReturn => {
  const [users, setUsers] = useState<UserWithInviter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<UserWithInviter[]>('/admin/users');

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setUsers(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch admin users');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUserRole = useCallback(async (userId: string, role: 'head_ta' | 'admin'): Promise<ApiResponse<User>> => {
    const response = await apiClient.put<User>(`/admin/users/${userId}/role`, { role });
    
    if (!response.error && response.data) {
      // Optimistically update the local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role } : user
      ));
    }
    
    return response;
  }, []);

  const deleteUser = useCallback(async (userId: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<void>(`/admin/users/${userId}`);
    
    if (!response.error) {
      // Remove from local state
      setUsers(prev => prev.filter(user => user.id !== userId));
    }
    
    return response;
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
    updateUserRole,
    deleteUser,
  };
};

interface UseAdminStatsReturn {
  stats: AdminStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useAdminStats = (): UseAdminStatsReturn => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<AdminStats>('/admin/stats');

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setStats(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch admin stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
};

interface UseInvitationTreeReturn {
  tree: InvitationTree | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useInvitationTree = (userId?: string): UseInvitationTreeReturn => {
  const [tree, setTree] = useState<InvitationTree | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTree = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = userId 
        ? `/admin/invitation-tree/${userId}`
        : '/admin/invitation-tree';
      
      const response = await apiClient.get<InvitationTree>(endpoint);

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setTree(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch invitation tree');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  return {
    tree,
    loading,
    error,
    refetch: fetchTree,
  };
};

// Hook for bulk operations
interface UseBulkOperationsReturn {
  bulkUpdateRoles: (updates: Array<{ userId: string; role: 'head_ta' | 'admin' }>) => Promise<ApiResponse<void>>;
  bulkDeleteUsers: (userIds: string[]) => Promise<ApiResponse<void>>;
  bulkRevokeInvitations: (invitationIds: string[]) => Promise<ApiResponse<void>>;
  loading: boolean;
  error: string | null;
}

export const useBulkOperations = (): UseBulkOperationsReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bulkUpdateRoles = useCallback(async (
    updates: Array<{ userId: string; role: 'head_ta' | 'admin' }>
  ): Promise<ApiResponse<void>> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<void>('/admin/bulk/update-roles', { updates });
      
      if (response.error) {
        setError(response.error);
      }
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update roles';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkDeleteUsers = useCallback(async (userIds: string[]): Promise<ApiResponse<void>> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<void>('/admin/bulk/delete-users', { userIds });
      
      if (response.error) {
        setError(response.error);
      }
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete users';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkRevokeInvitations = useCallback(async (invitationIds: string[]): Promise<ApiResponse<void>> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<void>('/admin/bulk/revoke-invitations', { invitationIds });
      
      if (response.error) {
        setError(response.error);
      }
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to revoke invitations';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    bulkUpdateRoles,
    bulkDeleteUsers,
    bulkRevokeInvitations,
    loading,
    error,
  };
};

// Hook for audit log
interface AuditLogEntry {
  id: string;
  action: string;
  userId: string;
  targetId?: string;
  targetType?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  user?: User;
}

interface UseAuditLogReturn {
  entries: AuditLogEntry[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

export const useAuditLog = (pageSize: number = 50): UseAuditLogReturn => {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const fetchEntries = useCallback(async (pageNum: number = 1) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<{
        entries: AuditLogEntry[];
        hasMore: boolean;
      }>(`/admin/audit-log?page=${pageNum}&pageSize=${pageSize}`);

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        if (pageNum === 1) {
          setEntries(response.data.entries);
        } else {
          setEntries(prev => [...prev, ...response.data.entries]);
        }
        setHasMore(response.data.hasMore);
        setPage(pageNum);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audit log');
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  const loadMore = useCallback(async () => {
    if (!loading && hasMore) {
      await fetchEntries(page + 1);
    }
  }, [loading, hasMore, page, fetchEntries]);

  useEffect(() => {
    fetchEntries(1);
  }, [fetchEntries]);

  return {
    entries,
    loading,
    error,
    refetch: () => fetchEntries(1),
    hasMore,
    loadMore,
  };
};