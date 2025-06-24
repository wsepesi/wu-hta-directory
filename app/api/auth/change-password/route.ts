import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { userRepository } from "@/lib/repositories/users";
import { hashPassword, verifyPassword, validatePassword } from "@/lib/password-utils";
import type { ApiResponse } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "You must be logged in to change your password" } as ApiResponse<never>,
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Validate new password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          error: "Password does not meet requirements",
          details: passwordValidation.errors 
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Get user with password hash directly from database
    const user = await userRepository.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { error: "User account not found. Please log in again." } as ApiResponse<never>,
        { status: 404 }
      );
    }

    // Get the password hash from the database
    const userWithPassword = await userRepository.findByIdWithPassword(session.user.id);
    if (!userWithPassword) {
      return NextResponse.json(
        { error: "User account not found. Please log in again." } as ApiResponse<never>,
        { status: 404 }
      );
    }

    // Check if new password is same as current
    const isSamePassword = await verifyPassword(newPassword, userWithPassword.passwordHash);
    if (isSamePassword) {
      return NextResponse.json(
        { error: "New password must be different from your current password" } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword, userWithPassword.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Current password is incorrect. Please try again." } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await userRepository.updatePassword(user.id, hashedPassword);

    return NextResponse.json({ 
      message: "Password changed successfully",
      data: { success: true }
    } as ApiResponse<{ success: boolean }>);
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { 
        error: "An unexpected error occurred while changing your password. Please try again later.",
        details: process.env.NODE_ENV === "development" ? error?.toString() : undefined
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}