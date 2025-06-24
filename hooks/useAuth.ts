import { useSession } from 'next-auth/react';
import { useCallback } from 'react';
import { signIn, signOut } from 'next-auth/react';
import type { User } from '@/lib/types';

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const { data: session, status } = useSession();

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated' && !!session?.user;
  const isAdmin = session?.user?.role === 'admin';

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
    isAdmin,
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