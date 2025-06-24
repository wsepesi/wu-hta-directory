import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Get the current user from the session
 * @returns The current user or null if not authenticated
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user || null;
}

/**
 * Require authentication for a route
 * Redirects to sign in page if not authenticated
 * @param redirectTo - Optional URL to redirect to after sign in
 */
export async function requireAuth(redirectTo?: string) {
  const user = await getCurrentUser();
  
  if (!user) {
    const signInUrl = redirectTo 
      ? `/auth/signin?callbackUrl=${encodeURIComponent(redirectTo)}`
      : "/auth/signin";
    redirect(signInUrl);
  }
  
  return user;
}

/**
 * Check if the current user has a specific role
 * @param allowedRoles - Array of allowed roles
 * @returns Boolean indicating if user has permission
 */
export async function hasPermission(allowedRoles: string[]): Promise<boolean> {
  const user = await getCurrentUser();
  
  if (!user) {
    return false;
  }
  
  return allowedRoles.includes(user.role);
}

/**
 * Require specific role(s) for a route
 * Redirects to unauthorized page if user doesn't have the required role
 * @param allowedRoles - Array of allowed roles
 * @param redirectTo - Optional URL to redirect to if unauthorized
 */
export async function requireRole(allowedRoles: string[], redirectTo: string = "/unauthorized") {
  const user = await requireAuth();
  
  if (!allowedRoles.includes(user.role)) {
    redirect(redirectTo);
  }
  
  return user;
}

/**
 * Check if user is an admin
 * @returns Boolean indicating if user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  return hasPermission(["admin"]);
}

/**
 * Require admin role
 * Redirects to unauthorized page if user is not an admin
 */
export async function requireAdmin() {
  return requireRole(["admin"]);
}

/**
 * Get user initials for avatar display
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @returns Initials string
 */
export function getUserInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

/**
 * Format user's full name
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @returns Full name string
 */
export function formatUserName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`;
}