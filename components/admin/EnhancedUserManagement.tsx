"use client";

import { useState, useEffect } from "react";
import { useUsers } from "@/hooks/useUsers";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { logAuditEvent } from "@/lib/audit-logger";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  gradYear: number | null;
  createdAt: Date;
  invitedBy: string | null;
}

export default function EnhancedUserManagement() {
  const { users, loading, error, refetch } = useUsers();
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [bulkAction, setBulkAction] = useState<string>("");
  const [processing, setProcessing] = useState(false);

  const filteredUsers = users?.filter(user => {
    const matchesSearch = searchQuery === "" ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  }) || [];

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/toggle-role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      
      if (!response.ok) throw new Error("Failed to update role");
      
      await refetch();
    } catch (err) {
      console.error("Error updating role:", err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) throw new Error("Failed to delete user");
      
      await refetch();
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedUsers.size === 0) return;
    
    setProcessing(true);
    
    try {
      for (const userId of selectedUsers) {
        switch (bulkAction) {
          case "activate":
            await handleRoleChange(userId, "head_ta");
            break;
          case "deactivate":
            await handleRoleChange(userId, "inactive");
            break;
          case "delete":
            await handleDeleteUser(userId);
            break;
        }
      }
      
      setSelectedUsers(new Set());
      setBulkAction("");
      await refetch();
    } catch (err) {
      console.error("Error performing bulk action:", err);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage variant="error">Failed to load users</ErrorMessage>;
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="search"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Roles</option>
            <option value="head_ta">Head TA</option>
            <option value="admin">Admin</option>
            <option value="inactive">Inactive</option>
          </select>

          {selectedUsers.size > 0 && (
            <>
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Bulk Actions</option>
                <option value="activate">Activate</option>
                <option value="deactivate">Deactivate</option>
                <option value="delete">Delete</option>
              </select>
              
              <Button
                variant="primary"
                onClick={handleBulkAction}
                disabled={!bulkAction || processing}
              >
                {processing ? "Processing..." : `Apply to ${selectedUsers.size} users`}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Graduation Year
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(user.id)}
                    onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="head_ta">Head TA</option>
                    <option value="admin">Admin</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.gradYear || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No users found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}