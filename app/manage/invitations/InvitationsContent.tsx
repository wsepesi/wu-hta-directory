"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Invitation {
  id: string;
  email: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
  usedAt?: Date | null;
}

interface InvitationsContentProps {
  pending: Invitation[];
  used: Invitation[];
  expired: Invitation[];
}

export function InvitationsContent({ pending, used, expired }: InvitationsContentProps) {
  const router = useRouter();
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

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
        router.refresh();
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
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to revoke invitation:", error);
    }
  };

  const totalInvitations = pending.length + used.length + expired.length;

  return (
    <>
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-16">
        <div className="border-t border-charcoal pt-4">
          <dt className="text-sm uppercase tracking-wider text-charcoal/70 mb-2">
            Pending
          </dt>
          <dd className="text-3xl font-serif text-charcoal">
            {pending.length}
          </dd>
        </div>

        <div className="border-t border-charcoal pt-4">
          <dt className="text-sm uppercase tracking-wider text-charcoal/70 mb-2">
            Accepted
          </dt>
          <dd className="text-3xl font-serif text-charcoal">
            {used.length}
          </dd>
        </div>

        <div className="border-t border-charcoal pt-4">
          <dt className="text-sm uppercase tracking-wider text-charcoal/70 mb-2">
            Expired
          </dt>
          <dd className="text-3xl font-serif text-charcoal/70">
            {expired.length}
          </dd>
        </div>
      </div>

      {/* Send New Invitation */}
      <div className="mb-16 text-center">
        <Link
          href="/auth/invite"
          className="inline-flex items-center px-6 py-3 text-sm uppercase tracking-wider border border-charcoal text-charcoal hover:opacity-70 transition-opacity duration-200"
        >
          Send New Invitation
        </Link>
      </div>

      {/* Pending Invitations */}
      {pending.length > 0 && (
        <div className="mb-16">
          <h2 className="text-2xl font-serif text-charcoal mb-8">Pending Invitations</h2>
          <div className="space-y-6">
            {pending.map((invitation) => (
              <div key={invitation.id} className="border-t border-charcoal/20 pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-lg font-serif text-charcoal">
                      {invitation.email}
                    </p>
                    <p className="text-sm text-charcoal/70 mt-1">
                      Sent {formatDate(invitation.createdAt)} • 
                      Expires {formatDate(invitation.expiresAt)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4 ml-6">
                    <button
                      onClick={() => copyInviteLink(invitation.token)}
                      className="text-sm uppercase tracking-wider text-charcoal hover:opacity-70 transition-opacity duration-200"
                    >
                      {copiedToken === invitation.token ? "Copied" : "Copy link"}
                    </button>
                    <button
                      onClick={() => handleResend(invitation.id)}
                      className="text-sm uppercase tracking-wider text-charcoal hover:opacity-70 transition-opacity duration-200"
                    >
                      Resend
                    </button>
                    <button
                      onClick={() => handleRevoke(invitation.id)}
                      className="text-sm uppercase tracking-wider text-red-800 hover:opacity-70 transition-opacity duration-200"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accepted Invitations */}
      {used.length > 0 && (
        <div className="mb-16">
          <h2 className="text-2xl font-serif text-charcoal mb-8">Accepted Invitations</h2>
          <div className="space-y-6">
            {used.map((invitation) => (
              <div key={invitation.id} className="border-t border-charcoal/20 pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-serif text-charcoal">
                      {invitation.email}
                    </p>
                    <p className="text-sm text-charcoal/70 mt-1">
                      Accepted {invitation.usedAt && formatDate(invitation.usedAt)}
                    </p>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 text-xs uppercase tracking-wider border border-charcoal text-charcoal">
                    Accepted
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expired Invitations */}
      {expired.length > 0 && (
        <div className="mb-16">
          <h2 className="text-2xl font-serif text-charcoal mb-8">Expired Invitations</h2>
          <div className="space-y-6">
            {expired.map((invitation) => (
              <div key={invitation.id} className="border-t border-charcoal/20 pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-serif text-charcoal">
                      {invitation.email}
                    </p>
                    <p className="text-sm text-charcoal/70 mt-1">
                      Expired {formatDate(invitation.expiresAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleResend(invitation.id)}
                    className="text-sm uppercase tracking-wider text-charcoal hover:opacity-70 transition-opacity duration-200"
                  >
                    Send new invitation
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {totalInvitations === 0 && (
        <div className="text-center py-16">
          <p className="text-lg font-serif text-charcoal/70 mb-8">
            You haven&apos;t sent any invitations yet.
          </p>
          <Link
            href="/auth/invite"
            className="inline-flex items-center px-6 py-3 text-sm uppercase tracking-wider border border-charcoal text-charcoal hover:opacity-70 transition-opacity duration-200"
          >
            Send Your First Invitation
          </Link>
        </div>
      )}

      {/* Back to Dashboard */}
      <div className="mt-16 text-center">
        <Link
          href="/dashboard"
          className="text-sm uppercase tracking-wider text-charcoal hover:opacity-70 transition-opacity duration-200"
        >
          Back to dashboard
        </Link>
      </div>
    </>
  );
}