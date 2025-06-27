"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface BulkInvitationModalProps {
  profileCount: number;
  onConfirm: (personalMessage?: string) => Promise<void>;
  onCancel: () => void;
}

export function BulkInvitationModal({
  profileCount,
  onConfirm,
  onCancel,
}: BulkInvitationModalProps) {
  const [personalMessage, setPersonalMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleConfirm = async () => {
    setIsSending(true);
    try {
      await onConfirm(personalMessage);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 max-w-lg w-full mx-4 border border-charcoal/20">
        <h2 className="text-xl font-serif mb-4">Send Bulk Invitations</h2>
        
        <div className="mb-6">
          <p className="text-charcoal/80 mb-2">
            You are about to send invitations to <strong>{profileCount}</strong> unclaimed profile{profileCount > 1 ? 's' : ''}.
          </p>
          <p className="text-sm text-charcoal/60">
            Each person will receive an email invitation to claim their profile and join the Head TA directory.
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-charcoal mb-2">
            Personal Message (Optional)
          </label>
          <textarea
            value={personalMessage}
            onChange={(e) => setPersonalMessage(e.target.value)}
            placeholder="Add a message to include in all invitations..."
            className="w-full p-3 border border-charcoal/20 h-32 resize-none"
            maxLength={500}
          />
          <p className="mt-1 text-xs text-charcoal/60">
            {personalMessage.length}/500 characters
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 p-4 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Invitations will only be sent to profiles that don&apos;t have an active invitation. 
            Profiles with existing active invitations will be skipped.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSending}
          >
            {isSending ? `Sending ${profileCount} Invitations...` : `Send ${profileCount} Invitations`}
          </Button>
        </div>
      </div>
    </div>
  );
}