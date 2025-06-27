import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { userRepository } from '@/lib/repositories/users';
import { taAssignmentRepository } from '@/lib/repositories/hta-records';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Users can only check their own claimable profiles
    if (currentUser.id !== id && currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Find claimable profiles
    const claimableProfiles = await userRepository.findClaimableProfiles(id);

    // For each profile, fetch their TA assignments with relations
    const profilesWithAssignments = await Promise.all(
      claimableProfiles.map(async (profile) => {
        const assignments = await taAssignmentRepository.findByUserIdWithRelations(profile.id);
        return {
          ...profile,
          taAssignments: assignments,
        };
      })
    );

    return NextResponse.json({
      profiles: profilesWithAssignments,
    });
  } catch (error) {
    console.error('Error fetching claimable profiles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch claimable profiles' },
      { status: 500 }
    );
  }
}