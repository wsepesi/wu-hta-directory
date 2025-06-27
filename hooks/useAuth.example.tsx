// Example usage of the useAuth hook for conditional UI rendering

import { useAuth } from './useAuth';

// Example 1: Basic authentication check
export function EditButton({ resourceId }: { resourceId: string }) {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <p className="text-sm text-gray-500">Sign in to edit</p>;
  }
  
  return (
    <button className="btn-primary">
      Edit Profile
    </button>
  );
}

// Example 2: Role-based rendering
export function AdminPanel() {
  const { isAdmin, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  if (!isAdmin) {
    return null; // Don't show anything for non-admins
  }
  
  return (
    <div className="admin-panel">
      <h2>Admin Controls</h2>
      {/* Admin-only features */}
    </div>
  );
}

// Example 3: Owner or admin can edit
export function ProfileEditButton({ profileUserId }: { profileUserId: string }) {
  const { canEdit } = useAuth();
  
  if (!canEdit(profileUserId)) {
    return <p className="text-sm text-gray-500">You don't have permission to edit this profile</p>;
  }
  
  return (
    <button className="btn-secondary">
      Edit This Profile
    </button>
  );
}

// Example 4: Course management features
export function CourseManagementTools() {
  const { canManageCourses, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <p>Please sign in to view course tools</p>;
  }
  
  if (!canManageCourses) {
    return <p>You need admin privileges to manage courses</p>;
  }
  
  return (
    <div>
      <button>Add Course</button>
      <button>Assign TAs</button>
      <button>Edit Offerings</button>
    </div>
  );
}

// Example 5: Conditional navbar items
export function Navigation() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  
  return (
    <nav>
      <a href="/">Home</a>
      <a href="/directory">Directory</a>
      
      {isAuthenticated ? (
        <>
          <a href="/dashboard">Dashboard</a>
          {isAdmin && <a href="/admin">Admin</a>}
          <span>Welcome, {user?.firstName}!</span>
          <button onClick={logout}>Sign Out</button>
        </>
      ) : (
        <>
          <a href="/auth/signin">Sign In</a>
          <a href="/auth/signup">Sign Up</a>
        </>
      )}
    </nav>
  );
}

// Example 6: Protected component with loading state
export function ProtectedContent() {
  const { isAuthenticated, loading, isHeadTA } = useAuth();
  
  if (loading) {
    return <div className="animate-pulse">Loading authentication...</div>;
  }
  
  if (!isAuthenticated) {
    return (
      <div className="text-center py-8">
        <p>This content is only available to authenticated users.</p>
        <a href="/auth/signin" className="text-blue-600 hover:underline">
          Sign in to continue
        </a>
      </div>
    );
  }
  
  return (
    <div>
      <h2>Protected Content</h2>
      {isHeadTA && <p>Welcome, Head TA! Here's your special content.</p>}
      {/* Protected content here */}
    </div>
  );
}

// Example 7: Using multiple permissions
export function UserCard({ userId }: { userId: string }) {
  const { canEdit, canViewPrivateInfo, hasRole } = useAuth();
  
  return (
    <div className="user-card">
      <h3>User Information</h3>
      
      {canViewPrivateInfo && (
        <div>
          {/* Show private information like email, phone */}
        </div>
      )}
      
      {canEdit(userId) && (
        <button>Edit User</button>
      )}
      
      {hasRole('admin') && (
        <button className="text-red-600">Delete User</button>
      )}
    </div>
  );
}

// Example 8: Action-based permission check
export function ResourceActions({ resourceOwnerId }: { resourceOwnerId: string }) {
  const { useCanPerformAction } = useAuth;
  const canEdit = useCanPerformAction('edit', resourceOwnerId);
  const canManage = useCanPerformAction('manage');
  const canView = useCanPerformAction('view');
  
  return (
    <div className="flex gap-2">
      {canView && <button>View</button>}
      {canEdit && <button>Edit</button>}
      {canManage && <button>Manage</button>}
    </div>
  );
}