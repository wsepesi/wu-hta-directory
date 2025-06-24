'use client';

import { useState } from 'react';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { SerifHeading, BodyText } from '../ui/Typography';
import { ErrorMessage } from '../ui/ErrorMessage';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { clsx } from 'clsx';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ta' | 'professor' | 'admin';
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
  lastLoginAt?: Date;
}

interface UserManagementProps {
  users: User[];
  loading?: boolean;
  error?: string;
  onUpdateUser: (userId: string, updates: Partial<User>) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  onInviteUser: (email: string, role: User['role']) => Promise<void>;
  className?: string;
}

export function UserManagement({
  users,
  loading = false,
  error,
  onUpdateUser,
  onDeleteUser,
  onInviteUser,
  className
}: UserManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<User['role'] | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<User['status'] | 'all'>('all');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<User['role']>('ta');
  const [inviting, setInviting] = useState(false);

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === '' ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleInvite = async () => {
    if (!inviteEmail) return;
    
    try {
      setInviting(true);
      await onInviteUser(inviteEmail, inviteRole);
      setInviteEmail('');
    } catch (error) {
      console.error('Failed to invite user:', error);
    } finally {
      setInviting(false);
    }
  };

  const getRoleBadgeColor = (role: User['role']) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'professor': return 'bg-blue-100 text-blue-800';
      case 'ta': return 'bg-green-100 text-green-800';
    }
  };

  const getStatusBadgeColor = (status: User['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage variant="error">{error}</ErrorMessage>;
  }

  return (
    <div className={clsx('space-y-6', className)}>
      {/* Invite new user */}
      <Card>
        <CardHeader>
          <SerifHeading className="text-xl">Invite New User</SerifHeading>
        </CardHeader>
        <CardBody>
          <div className="flex gap-3">
            <Input
              type="email"
              placeholder="Enter email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as User['role'])}
              className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-charcoal"
            >
              <option value="ta">TA</option>
              <option value="professor">Professor</option>
              <option value="admin">Admin</option>
            </select>
            <Button
              variant="primary"
              onClick={handleInvite}
              disabled={!inviteEmail || inviting}
            >
              {inviting ? 'Inviting...' : 'Send Invite'}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              type="search"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
              className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-charcoal"
            >
              <option value="all">All Roles</option>
              <option value="ta">TAs</option>
              <option value="professor">Professors</option>
              <option value="admin">Admins</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-charcoal"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </CardBody>
      </Card>

      {/* User list */}
      <Card>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-sm text-charcoal">User</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-charcoal">Role</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-charcoal">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-charcoal">Last Login</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm text-charcoal">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <BodyText className="font-medium text-sm">{user.name}</BodyText>
                        <BodyText className="text-xs text-gray-500">{user.email}</BodyText>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={clsx(
                        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                        getRoleBadgeColor(user.role)
                      )}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={clsx(
                        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                        getStatusBadgeColor(user.status)
                      )}>
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <BodyText className="text-sm text-gray-600">
                        {user.lastLoginAt 
                          ? new Date(user.lastLoginAt).toLocaleDateString()
                          : 'Never'
                        }
                      </BodyText>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onUpdateUser(user.id, {
                            status: user.status === 'active' ? 'inactive' : 'active'
                          })}
                        >
                          {user.status === 'active' ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <BodyText className="text-gray-500">
                No users found matching your criteria.
              </BodyText>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}