'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CleanLayout, { CleanPageHeader } from '@/components/layout/CleanLayout';
import { ClaimProfileModal } from '@/components/profile/ClaimProfileModal';
import { toast } from '@/hooks/useToast';
import type { User, Course } from '@/lib/types';

interface UnclaimedProfile extends User {
  taAssignments?: Array<{
    id: string;
    courseOffering: {
      semester: string;
      year: number;
      season: string;
      course: Course;
    };
  }>;
}

export default function ClaimProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [claimableProfiles, setClaimableProfiles] = useState<UnclaimedProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<UnclaimedProfile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const fetchCurrentUser = useCallback(async () => {
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch(`/api/users/${session.user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user details');
      }
      
      const data = await response.json();
      setCurrentUser(data);
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  }, [session?.user?.id]);

  const fetchClaimableProfiles = useCallback(async () => {
    try {
      const response = await fetch(`/api/users/${session?.user?.id}/claimable-profiles`);
      if (!response.ok) {
        throw new Error('Failed to fetch claimable profiles');
      }
      
      const data = await response.json();
      setClaimableProfiles(data.profiles || []);
    } catch (error) {
      console.error('Error fetching claimable profiles:', error);
      toast.error('Failed to load claimable profiles');
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  const handleSelectProfile = (profile: UnclaimedProfile) => {
    setSelectedProfile(profile);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProfile(null);
    // Refresh the page to update the list
    fetchClaimableProfiles();
  };

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin?callbackUrl=/profile/claim');
      return;
    }

    fetchClaimableProfiles();
    fetchCurrentUser();
  }, [session, status, router, fetchClaimableProfiles, fetchCurrentUser]);

  if (status === 'loading' || isLoading) {
    // Let the loading.tsx file handle the skeleton UI
    return null;
  }

  if (!session) {
    return null;
  }

  return (
    <CleanLayout maxWidth="4xl">
      <CleanPageHeader
        title="Claim Your Profile"
        subtitle="Found unclaimed profiles that may belong to you"
        description="Review the profiles below and claim any that belong to you. This will merge all associated course assignments with your current profile."
      />

      {claimableProfiles.length === 0 ? (
        <div className="bg-white rounded-lg border border-charcoal-100 p-12 text-center">
          <p className="text-charcoal-600 font-serif text-lg">
            No unclaimed profiles found that match your name.
          </p>
          <p className="mt-2 text-charcoal-400 text-sm">
            If you believe there should be unclaimed profiles for you, please contact an administrator.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {claimableProfiles.map((profile) => (
            <div
              key={profile.id}
              className="bg-white rounded-lg border border-charcoal-100 p-6 hover:border-charcoal-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-serif text-charcoal-900">
                    {profile.firstName} {profile.lastName}
                  </h3>
                  
                  <div className="mt-2 space-y-1">
                    {profile.gradYear && (
                      <p className="text-sm text-charcoal-600">
                        Graduation Year: {profile.gradYear}
                      </p>
                    )}
                    {profile.degreeProgram && (
                      <p className="text-sm text-charcoal-600">
                        Degree: {profile.degreeProgram}
                      </p>
                    )}
                    {profile.location && (
                      <p className="text-sm text-charcoal-600">
                        Location: {profile.location}
                      </p>
                    )}
                  </div>

                  {profile.taAssignments && profile.taAssignments.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-charcoal-700 mb-2">
                        Course Assignments ({profile.taAssignments.length})
                      </h4>
                      <div className="space-y-1">
                        {profile.taAssignments.slice(0, 3).map((assignment) => (
                          <p key={assignment.id} className="text-sm text-charcoal-500">
                            {assignment.courseOffering.course.courseNumber}: {assignment.courseOffering.course.courseName} 
                            <span className="text-charcoal-400"> • {assignment.courseOffering.semester}</span>
                          </p>
                        ))}
                        {profile.taAssignments.length > 3 && (
                          <p className="text-sm text-charcoal-400 italic">
                            and {profile.taAssignments.length - 3} more...
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleSelectProfile(profile)}
                  className="ml-6 px-4 py-2 text-sm font-medium text-white bg-charcoal-800 rounded-md hover:bg-charcoal-700 transition-colors"
                >
                  Claim Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <Link
          href="/profile"
          className="text-sm text-charcoal-600 hover:text-charcoal-800 transition-colors"
        >
          ← Back to your profile
        </Link>
      </div>

      {selectedProfile && currentUser && (
        <ClaimProfileModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          unclaimedProfile={{
            id: selectedProfile.id,
            name: `${selectedProfile.firstName} ${selectedProfile.lastName}`,
            courses: (selectedProfile.taAssignments || []).map(assignment => ({
              course: assignment.courseOffering.course,
              semester: assignment.courseOffering.semester,
              role: 'Head TA',
            })),
          }}
          currentUser={currentUser}
        />
      )}
    </CleanLayout>
  );
}