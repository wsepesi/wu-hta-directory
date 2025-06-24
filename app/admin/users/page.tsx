import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth-utils";
import EnhancedUserManagement from "@/components/admin/EnhancedUserManagement";

export const metadata: Metadata = {
  title: "User Management - WU Head TA Directory",
  description: "Manage all users in the Head TA Directory",
};

export default async function AdminUsersPage() {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            User Management
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage all users, their roles, and permissions
          </p>
        </div>

        <EnhancedUserManagement />

        <div className="mt-8 text-center">
          <a
            href="/admin"
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            Back to admin dashboard
          </a>
        </div>
      </div>
    </div>
  );
}