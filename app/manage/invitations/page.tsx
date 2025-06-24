"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useInvitations } from "@/hooks/useInvitations";

export default function ManageInvitationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  
  const { invitations, isLoading, mutate } = useInvitations(session?.user?.id);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!session) {
    router.push("/auth/login");
    return null;
  }

  // Categorize invitations
  const pending = invitations?.filter(
    (inv) => !inv.usedAt && new Date(inv.expiresAt) > new Date()
  ) || [];
  const used = invitations?.filter((inv) => inv.usedAt) || [];
  const expired = invitations?.filter(
    (inv) => !inv.usedAt && new Date(inv.expiresAt) <= new Date()
  ) || [];

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const copyInviteLink = async (token: string) => {
    const link = `${window.location.origin}/auth/register?token=${token}`;
    await navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleResend = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}/resend`, {
        method: "POST",
      });
      if (response.ok) {
        mutate();
      }
    } catch (error) {
      console.error("Failed to resend invitation:", error);
    }
  };

  const handleRevoke = async (invitationId: string) => {
    if (!confirm("Are you sure you want to revoke this invitation?")) {
      return;
    }
    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        mutate();
      }
    } catch (error) {
      console.error("Failed to revoke invitation:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            My Invitations
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Track and manage invitations you've sent
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Pending
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-yellow-600">
                {pending.length}
              </dd>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Accepted
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-green-600">
                {used.length}
              </dd>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Expired
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-400">
                {expired.length}
              </dd>
            </div>
          </div>
        </div>

        {/* Send New Invitation */}
        <div className="mb-8 text-center">
          <Link
            href="/auth/invite"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Send New Invitation
          </Link>
        </div>

        {/* Pending Invitations */}
        {pending.length > 0 && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900">Pending Invitations</h2>
            </div>
            <div className="border-t border-gray-200">
              <ul className="divide-y divide-gray-200">
                {pending.map((invitation) => (
                  <li key={invitation.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {invitation.email}
                        </p>
                        <p className="text-sm text-gray-500">
                          Sent {formatDate(invitation.createdAt)} • 
                          Expires {formatDate(invitation.expiresAt)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => copyInviteLink(invitation.token)}
                          className="text-sm text-indigo-600 hover:text-indigo-500"
                        >
                          {copiedToken === invitation.token ? "Copied!" : "Copy link"}
                        </button>
                        <button
                          onClick={() => handleResend(invitation.id)}
                          className="text-sm text-indigo-600 hover:text-indigo-500"
                        >
                          Resend
                        </button>
                        <button
                          onClick={() => handleRevoke(invitation.id)}
                          className="text-sm text-red-600 hover:text-red-500"
                        >
                          Revoke
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Accepted Invitations */}
        {used.length > 0 && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900">Accepted Invitations</h2>
            </div>
            <div className="border-t border-gray-200">
              <ul className="divide-y divide-gray-200">
                {used.map((invitation) => (
                  <li key={invitation.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {invitation.email}
                        </p>
                        <p className="text-sm text-gray-500">
                          Accepted {invitation.usedAt && formatDate(invitation.usedAt)}
                        </p>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Accepted
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Expired Invitations */}
        {expired.length > 0 && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900">Expired Invitations</h2>
            </div>
            <div className="border-t border-gray-200">
              <ul className="divide-y divide-gray-200">
                {expired.map((invitation) => (
                  <li key={invitation.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {invitation.email}
                        </p>
                        <p className="text-sm text-gray-500">
                          Expired {formatDate(invitation.expiresAt)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleResend(invitation.id)}
                        className="text-sm text-indigo-600 hover:text-indigo-500"
                      >
                        Send new invitation
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {!isLoading && invitations?.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500">You haven't sent any invitations yet.</p>
            <Link
              href="/auth/invite"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Send Your First Invitation
            </Link>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/dashboard"
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}