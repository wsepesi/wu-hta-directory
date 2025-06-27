import { NextRequest, NextResponse } from 'next/server';
import { invitationRepository } from '@/lib/repositories/invitations';
import type { ApiResponse, Invitation } from '@/lib/types';

/**
 * POST /api/invitations/validate
 * Validate an invitation token (public endpoint for signup)
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Find valid invitation by token
    const invitation = await invitationRepository.findValidByToken(token);

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation token' } as ApiResponse<never>,
        { status: 404 }
      );
    }

    // Return invitation details (without sensitive info)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { token: _token, ...invitationData } = invitation;

    return NextResponse.json(
      { 
        data: invitationData,
        message: 'Valid invitation token'
      } as ApiResponse<Omit<Invitation, 'token'>>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error validating invitation:', error);
    return NextResponse.json(
      { error: 'Failed to validate invitation' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}