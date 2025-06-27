import { useSession } from 'next-auth/react';
import { useCallback, useMemo } from 'react';
import { signIn, signOut } from 'next-auth/react';
import type { User } from '@/lib/types';

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loading: boolean; // Alias for isLoading for convenience
  isAdmin: boolean;
  isHeadTA: boolean;
  canEdit: (resourceOwnerId?: string) => boolean;
  canManageCourses: boolean;
  canManageUsers: boolean;
  canViewPrivateInfo: boolean;
  hasRole: (role: 'admin' | 'head_ta') => boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const { data: session, status } = useSession();

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated' && !!session?.user;
  const isAdmin = session?.user?.role === 'admin';
  const isHeadTA = session?.user?.role === 'head_ta';

  const user: User | null = session?.user ? {
    id: session.user.id,
    email: session.user.email,
    firstName: session.user.firstName,
    lastName: session.user.lastName,
    role: session.user.role as 'head_ta' | 'admin',
    // These fields would need to be fetched separately if needed
    gradYear: undefined,
    degreeProgram: undefined,
    currentRole: undefined,
    linkedinUrl: undefined,
    personalSite: undefined,
    location: undefined,
    invitedBy: undefined,
    createdAt: new Date(), // Placeholder
    updatedAt: new Date(), // Placeholder
  } : null;

  // Permission checking functions
  const canEdit = useCallback((resourceOwnerId?: string): boolean => {
    if (!isAuthenticated) return false;
    if (isAdmin) return true;
    if (resourceOwnerId && user?.id === resourceOwnerId) return true;
    return false;
  }, [isAuthenticated, isAdmin, user?.id]);

  const hasRole = useCallback((role: 'admin' | 'head_ta'): boolean => {
    return user?.role === role;
  }, [user?.role]);

  // Derived permissions
  const permissions = useMemo(() => ({
    canManageCourses: isAdmin,
    canManageUsers: isAdmin,
    canViewPrivateInfo: isAuthenticated,
  }), [isAdmin, isAuthenticated]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      throw new Error(result.error);
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut({ redirect: false });
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    loading: isLoading, // Alias for convenience
    isAdmin,
    isHeadTA,
    canEdit,
    canManageCourses: permissions.canManageCourses,
    canManageUsers: permissions.canManageUsers,
    canViewPrivateInfo: permissions.canViewPrivateInfo,
    hasRole,
    login,
    logout,
  };
};

// Hook for requiring authentication
export const useRequireAuth = (redirectTo: string = '/auth/signin') => {
  const { isAuthenticated, isLoading } = useAuth();

  if (!isLoading && !isAuthenticated && typeof window !== 'undefined') {
    window.location.href = redirectTo;
  }

  return { isAuthenticated, isLoading };
};

// Hook for requiring admin role
export const useRequireAdmin = (redirectTo: string = '/unauthorized') => {
  const { isAdmin, isLoading, isAuthenticated } = useAuth();

  if (!isLoading && isAuthenticated && !isAdmin && typeof window !== 'undefined') {
    window.location.href = redirectTo;
  }

  return { isAdmin, isLoading };
};

// Hook for checking if user can perform an action
export const useCanPerformAction = (action: 'edit' | 'manage' | 'view', resourceOwnerId?: string) => {
  const { isAuthenticated, isAdmin, user, canEdit } = useAuth();

  switch (action) {
    case 'edit':
      return canEdit(resourceOwnerId);
    case 'manage':
      return isAdmin;
    case 'view':
      return isAuthenticated;
    default:
      return false;
  }
};