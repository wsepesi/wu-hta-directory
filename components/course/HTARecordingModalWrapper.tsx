'use client';

import { HeadTARecordingModal } from './HTARecordingModal';
import { useAuth } from '@/hooks/useAuth';

interface HeadTARecordingModalWrapperProps {
  courseOfferingId: string;
  courseNumber: string;
  courseName: string;
  semester: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function HeadTARecordingModalWrapper(props: HeadTARecordingModalWrapperProps) {
  const { isAdmin } = useAuth();

  // Only render the modal if user is admin
  if (!isAdmin) {
    return null;
  }

  return <HeadTARecordingModal {...props} />;
}