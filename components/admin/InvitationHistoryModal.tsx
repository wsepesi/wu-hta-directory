"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { format } from 'date-fns';

interface InvitationRecord {
  id: string;
  email: string;
  invitedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: Date;
  expiresAt: Date;
  usedAt: Date | null;
  status: 'pending' | 'accepted' | 'expired';
}

interface InvitationHistoryModalProps {
  profileId: string;
  onClose: () => void;
}

export function InvitationHistoryModal({
  profileId,
  onClose,
}: InvitationHistoryModalProps) {
  const [history, setHistory] = useState<InvitationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${profileId}/invitation-history`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch invitation history');
      }
      
      const data = await response.json();
      setHistory(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const getStatusBadge = (record: InvitationRecord) => {
    switch (record.status) {
      case 'accepted':
        return {
          label: 'Accepted',
          className: 'text-green-600 bg-green-50',
        };
      case 'pending':
        return {
          label: 'Pending',
          className: 'text-blue-600 bg-blue-50',
        };
      case 'expired':
        return {
          label: 'Expired',
          className: 'text-red-600 bg-red-50',
        };
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden border border-charcoal/20">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-serif">Invitation History</h2>
          <button
            onClick={onClose}
            className="text-charcoal/40 hover:text-charcoal/60"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-charcoal/60">No invitation history found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((record) => {
                const status = getStatusBadge(record);
                
                return (
                  <div
                    key={record.id}
                    className="border border-charcoal/10 p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-charcoal">
                          Sent to: {record.email}
                        </p>
                        <p className="text-sm text-charcoal/60">
                          By: {record.invitedBy.firstName} {record.invitedBy.lastName}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-charcoal/60">Sent:</span>
                        <span className="ml-2">{format(new Date(record.createdAt), 'MMM d, yyyy h:mm a')}</span>
                      </div>
                      <div>
                        <span className="text-charcoal/60">Expires:</span>
                        <span className="ml-2">{format(new Date(record.expiresAt), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                    
                    {record.usedAt && (
                      <div className="text-sm">
                        <span className="text-charcoal/60">Accepted:</span>
                        <span className="ml-2">{format(new Date(record.usedAt), 'MMM d, yyyy h:mm a')}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}