import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { userRepository } from '@/lib/repositories/users';
import { taAssignmentRepository } from '@/lib/repositories/hta-records';
import type { ApiResponse, User, CreateTAAssignmentInput } from '@/lib/types';

/**
 * POST /api/hta-records/mark-unclaimed
 * Create an unclaimed profile for a missing HTA and record them for a course offering
 * Only authenticated HTAs can use this endpoint
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' } as ApiResponse<never>,
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { courseOfferingId, firstName, lastName, email, gradYear, degreeProgram, location } = body;

    // Validate required fields
    if (!courseOfferingId || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields: courseOfferingId, firstName, and lastName are required' } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Check if an unclaimed profile already exists for this person
    let unclaimedProfile = await userRepository.getUnclaimedByName(firstName, lastName);

    // If no unclaimed profile exists, create one
    if (!unclaimedProfile) {
      unclaimedProfile = await userRepository.createUnclaimedProfile({
        firstName,
        lastName,
        email,
        gradYear,
        degreeProgram,
        location
      });
    }

    // Create the TA assignment with autoInvite set to false
    const taAssignmentInput: CreateTAAssignmentInput = {
      userId: unclaimedProfile.id,
      courseOfferingId,
      hoursPerWeek: undefined,
      responsibilities: 'Head TA (unclaimed profile)',
      autoInvite: false // Don't send email for unclaimed profiles
    };
    
    const taAssignment = await taAssignmentRepository.create(taAssignmentInput);

    // Log the action
    console.log(`Created unclaimed profile for ${firstName} ${lastName} and assigned to course offering ${courseOfferingId} by user ${session.user.id}`);

    return NextResponse.json(
      { 
        data: { ...unclaimedProfile, taAssignmentId: taAssignment.id }, 
        message: 'Unclaimed profile created and assigned successfully'
      } as ApiResponse<User & { taAssignmentId: string }>,
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating unclaimed profile:', error);
    return NextResponse.json(
      { error: 'Failed to create unclaimed profile' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}