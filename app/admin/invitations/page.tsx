import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth-utils";
import Link from "next/link";
import EnhancedInvitationTree from "@/components/admin/EnhancedInvitationTree";
import { db } from "@/lib/db";
import { invitations, users } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export const metadata: Metadata = {
  title: "Invitation Analytics - WU Head TA Directory",
  description: "View and manage all invitations in the system",
};



export default async function AdminInvitationsPage() {
  await requireAdmin();

  // Get all invitations with inviter details
  const allInvitations = await db
    .select({
      invitation: invitations,
      inviter: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      },
    })
    .from(invitations)
    .leftJoin(users, eq(invitations.invitedBy, users.id))
    .orderBy(desc(invitations.createdAt));

  // Calculate statistics
  const totalInvitations = allInvitations.length;
  const pendingInvitations = allInvitations.filter(
    (inv) => !inv.invitation.usedAt && new Date(inv.invitation.expiresAt) > new Date()
  );
  const acceptedInvitations = allInvitations.filter((inv) => inv.invitation.usedAt);
  const expiredInvitations = allInvitations.filter(
    (inv) => !inv.invitation.usedAt && new Date(inv.invitation.expiresAt) <= new Date()
  );

  const acceptanceRate = totalInvitations > 0
    ? ((acceptedInvitations.length / totalInvitations) * 100).toFixed(1)
    : "0";



  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Invitation Analytics
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            View invitation trees and system-wide invitation statistics
          </p>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Total Sent
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {totalInvitations}
              </dd>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Pending
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-yellow-600">
                {pendingInvitations.length}
              </dd>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Accepted
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-green-600">
                {acceptedInvitations.length}
              </dd>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Expired
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-400">
                {expiredInvitations.length}
              </dd>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Success Rate
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-indigo-600">
                {acceptanceRate}%
              </dd>
            </div>
          </div>
        </div>

        {/* Enhanced Invitation Tree Visualization */}
        <div className="mb-8">
          <EnhancedInvitationTree />
        </div>

        {/* Recent Invitations */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">
              Recent Invitations
            </h2>
          </div>
          <div className="border-t border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invited By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sent Date
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allInvitations.slice(0, 10).map(({ invitation, inviter }) => {
                  const isPending = !invitation.usedAt && new Date(invitation.expiresAt) > new Date();
                  const isExpired = !invitation.usedAt && new Date(invitation.expiresAt) <= new Date();
                  const isAccepted = !!invitation.usedAt;

                  return (
                    <tr key={invitation.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {invitation.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {inviter ? (
                          <Link
                            href={`/profile/${inviter.id}`}
                            className="text-indigo-600 hover:text-indigo-500"
                          >
                            {inviter.firstName} {inviter.lastName}
                          </Link>
                        ) : (
                          <span className="text-gray-400">System</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isPending && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                        {isExpired && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Expired
                          </span>
                        )}
                        {isAccepted && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Accepted
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(invitation.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {isPending && (
                          <form
                            action={`/api/invitations/${invitation.id}`}
                            method="DELETE"
                            className="inline"
                          >
                            <button
                              type="submit"
                              className="text-red-600 hover:text-red-900"
                            >
                              Revoke
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-center space-x-4">
          <Link
            href="/auth/invite"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Send Bulk Invitations
          </Link>
          <Link
            href="/admin"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}