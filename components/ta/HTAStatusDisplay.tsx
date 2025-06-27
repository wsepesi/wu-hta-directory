'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { toast } from '@/hooks/useToast';
import { UnclaimedProfileBadge } from './UnclaimedProfileBadge';
import { Button } from '@/components/ui/Button';

interface HeadTAStatusDisplayProps {
  ta?: {
    id: string;
    firstName: string;
    lastName: string;
    isUnclaimed?: boolean;
    invitationSent?: Date;
    recordedBy?: string;
    recordedAt?: Date;
  };
  showInviteButton?: boolean;
  className?: string;
}

export function HeadTAStatusDisplay({ ta, showInviteButton = false, className = '' }: HeadTAStatusDisplayProps) {
  const { data: session } = useSession();
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [invitationSent, setInvitationSent] = useState(ta?.invitationSent);
  const isAdmin = session?.user?.role === 'admin';

  const handleSendInvitation = async () => {
    if (!ta || !isAdmin) return;
    
    setIsSendingInvite(true);
    try {
      const response = await fetch(`/api/users/${ta.id}/send-claim-invitation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send invitation');
      }

      const data = await response.json();
      setInvitationSent(new Date(data.invitationSentAt));
      toast.success('Invitation sent successfully');
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send invitation');
    } finally {
      setIsSendingInvite(false);
    }
  };

  // No Head TA recorded
  if (!ta) {
    return (
      <span className={`inline-flex items-center gap-2 font-serif text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 px-3 py-1 rounded-full ${className}`}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        No Head TA Recorded
      </span>
    );
  }

  // Unclaimed profile
  if (ta.isUnclaimed) {
    return (
      <div className={`inline-flex items-center gap-3 ${className}`}>
        <Link
          href={`/profile/${ta.id}`}
          className="font-serif text-charcoal hover:opacity-70 transition-opacity duration-200"
        >
          {ta.firstName} {ta.lastName}
        </Link>
        <UnclaimedProfileBadge size="sm" />
        
        {showInviteButton && isAdmin && (
          <div className="inline-flex items-center gap-2">
            {invitationSent ? (
              <span className="text-xs text-green-600 font-serif" title={`Invitation sent on ${new Date(invitationSent).toLocaleDateString()}`}>
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Invitation sent
              </span>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                onClick={handleSendInvitation}
                disabled={isSendingInvite}
                className="text-xs"
              >
                {isSendingInvite ? 'Sending...' : 'Send Invitation'}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Claimed profile
  return (
    <Link
      href={`/profile/${ta.id}`}
      className={`font-serif text-charcoal hover:opacity-70 transition-opacity duration-200 ${className}`}
    >
      {ta.firstName} {ta.lastName}
    </Link>
  );
}
