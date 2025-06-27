import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { taAssignmentRepository } from '@/lib/repositories/hta-records';
import { userRepository } from '@/lib/repositories/users';
import { courseOfferingRepository } from '@/lib/repositories/course-offerings';
import { z } from 'zod';
import type { ApiResponse, CreateTAAssignmentInput, TAAssignment } from '@/lib/types';

const bulkHistoricalAssignmentSchema = z.object({
  assignments: z.array(z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email().optional(),
    courseOfferingId: z.string().uuid(),
    hoursPerWeek: z.number().min(1).max(40).optional(),
    responsibilities: z.string().optional(),
    gradYear: z.number().min(2000).max(2100).optional(),
    degreeProgram: z.string().optional(),
    location: z.string().optional(),
  }))
});

interface BulkAssignmentResult {
  created: number;
  skipped: number;
  errors: Array<{ index: number; error: string }>;
  assignments: TAAssignment[];
}

/**
 * POST /api/ta-assignments/bulk-historical
 * Create multiple historical TA assignments without sending invitations
 * Admin only endpoint
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

    // Verify admin role
    const currentUser = await userRepository.findById(session.user.id);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' } as ApiResponse<never>,
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = bulkHistoricalAssignmentSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data', 
          details: validation.error.flatten() 
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    const { assignments } = validation.data;
    const result: BulkAssignmentResult = {
      created: 0,
      skipped: 0,
      errors: [],
      assignments: []
    };

    // Process each assignment
    for (let i = 0; i < assignments.length; i++) {
      const assignment = assignments[i];
      
      try {
        // Verify course offering exists
        const courseOffering = await courseOfferingRepository.findById(assignment.courseOfferingId);
        if (!courseOffering) {
          result.errors.push({ 
            index: i, 
            error: `Course offering ${assignment.courseOfferingId} not found` 
          });
          result.skipped++;
          continue;
        }

        // Check if an unclaimed profile already exists
        let user = await userRepository.getUnclaimedByName(
          assignment.firstName, 
          assignment.lastName
        );

        // If no unclaimed profile exists, create one
        if (!user) {
          user = await userRepository.createUnclaimedProfile({
            firstName: assignment.firstName,
            lastName: assignment.lastName,
            email: assignment.email,
            gradYear: assignment.gradYear,
            degreeProgram: assignment.degreeProgram,
            location: assignment.location
          });
        }

        // Check if assignment already exists
        const existingAssignment = await taAssignmentRepository.findByUserAndCourseOffering(
          user.id,
          assignment.courseOfferingId
        );

        if (existingAssignment) {
          result.errors.push({ 
            index: i, 
            error: `Assignment already exists for ${assignment.firstName} ${assignment.lastName} in this course offering` 
          });
          result.skipped++;
          continue;
        }

        // Create TA assignment with autoInvite set to false
        const taAssignmentInput: CreateTAAssignmentInput = {
          userId: user.id,
          courseOfferingId: assignment.courseOfferingId,
          hoursPerWeek: assignment.hoursPerWeek,
          responsibilities: assignment.responsibilities || 'Head TA (historical record)',
          autoInvite: false // Explicitly set to false to prevent emails
        };

        const createdAssignment = await taAssignmentRepository.create(taAssignmentInput);
        result.assignments.push(createdAssignment);
        result.created++;

      } catch (error) {
        console.error(`Error processing assignment ${i}:`, error);
        result.errors.push({ 
          index: i, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        result.skipped++;
      }
    }

    return NextResponse.json(
      {
        data: result,
        message: `Successfully created ${result.created} assignments, skipped ${result.skipped}`
      } as ApiResponse<BulkAssignmentResult>,
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating bulk historical assignments:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to create bulk assignments' 
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}