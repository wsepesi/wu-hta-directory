'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/useToast';

interface UnclaimedTAMarkerProps {
  courseId?: string;
  semesterId?: string;
  className?: string;
}

export function UnclaimedTAMarker({ courseId, semesterId, className = '' }: UnclaimedTAMarkerProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClick = () => {
    if (!session?.user) {
      toast.error('You must be logged in to add an unclaimed profile');
      return;
    }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a name');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/unclaimed-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          courseId,
          semesterId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create unclaimed profile');
      }

      const data = await response.json();
      toast.success('Unclaimed profile created successfully');
      router.push(`/people/${data.profileId}`);
    } catch (error) {
      console.error('Error creating unclaimed profile:', error);
      toast.error('Failed to create unclaimed profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setName('');
  };

  if (showForm) {
    return (
      <div className="inline-flex items-center gap-2">
        <form onSubmit={handleSubmit} className="inline-flex items-center gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter TA name"
            className="px-3 py-1 text-sm border border-charcoal-200 rounded-md focus:outline-none focus:ring-2 focus:ring-charcoal-400 font-serif"
            autoFocus
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-3 py-1 text-sm font-medium text-white bg-charcoal-800 rounded-md hover:bg-charcoal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Creating...' : 'Create'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="px-3 py-1 text-sm font-medium text-charcoal-600 bg-white border border-charcoal-200 rounded-md hover:bg-charcoal-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
        </form>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center justify-center text-charcoal-400 hover:text-charcoal-800 hover:bg-charcoal-50 rounded px-2 py-1 transition-all duration-200 group ${className}`}
      title="Click to add missing TA"
    >
      <span className="font-serif text-lg tracking-wider group-hover:scale-110 transition-transform">
        ???
      </span>
    </button>
  );
}