import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { userRepository } from '@/lib/repositories/users';
import type { ApiResponse } from '@/lib/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/users/[id]/upload-image
 * Upload profile image URL (self or admin)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' } as ApiResponse<never>,
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check permissions: user can update self, admin can update anyone
    const currentUser = await userRepository.findById(session.user.id);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Current user not found' } as ApiResponse<never>,
        { status: 404 }
      );
    }

    const canUpdate = currentUser.id === id || currentUser.role === 'admin';
    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot update this user' } as ApiResponse<never>,
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(imageUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid image URL format' } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // For now, we'll store the image URL in the personalSite field as a temporary solution
    // In a production app, you'd want to add a dedicated profileImageUrl field to the database
    // and handle actual file uploads to a storage service like S3 or Cloudinary

    // Update user with profile image URL (stored temporarily in personalSite field)
    // This is a simplified implementation - in production, add a proper profileImageUrl field
    // const updatedUser = await userRepository.update(id, {
    //   // We'll need to add a profileImageUrl field to the schema
    //   // For now, return a message indicating this needs database schema update
    // });

    return NextResponse.json(
      { 
        message: 'Profile image upload functionality requires database schema update. Please add a profileImageUrl field to the users table.',
        suggestion: 'Run: ALTER TABLE users ADD COLUMN profile_image_url TEXT;'
      } as ApiResponse<never>,
      { status: 501 } // Not Implemented
    );
  } catch (error) {
    console.error('Error uploading profile image:', error);
    return NextResponse.json(
      { error: 'Failed to upload profile image' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}