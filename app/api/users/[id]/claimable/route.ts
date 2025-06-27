import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { userRepository } from '@/lib/repositories/users';
import type { ApiResponse } from '@/lib/types';

/**
 * GET /api/users/[id]/claimable
 * Check if a profile can be claimed by the current user
 * Returns boolean and reason if not claimable
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Extract the id from params
    const { id: unclaimedId } = await params;
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' } as ApiResponse<never>,
        { status: 401 }
      );
    }

    const currentUserId = session.user.id;

    // Get both user profiles
    const [unclaimedProfile, currentUser] = await Promise.all([
      userRepository.findById(unclaimedId),
      userRepository.findById(currentUserId)
    ]);

    if (!unclaimedProfile) {
      return NextResponse.json(
        { 
          data: {
            claimable: false,
            reason: 'Profile not found'
          }
        } as ApiResponse<{ claimable: boolean; reason: string }>,
        { status: 200 }
      );
    }

    if (!currentUser) {
      return NextResponse.json(
        { 
          data: {
            claimable: false,
            reason: 'Current user not found'
          }
        } as ApiResponse<{ claimable: boolean; reason: string }>,
        { status: 200 }
      );
    }

    // Check if the profile is actually unclaimed
    if (!unclaimedProfile.isUnclaimed) {
      return NextResponse.json(
        { 
          data: {
            claimable: false,
            reason: 'This profile has already been claimed'
          }
        } as ApiResponse<{ claimable: boolean; reason: string }>,
        { status: 200 }
      );
    }

    // Check if the profile was already claimed by someone
    if (unclaimedProfile.claimedBy) {
      return NextResponse.json(
        { 
          data: {
            claimable: false,
            reason: 'This profile has already been claimed by another user'
          }
        } as ApiResponse<{ claimable: boolean; reason: string }>,
        { status: 200 }
      );
    }

    // Verify name similarity
    const nameMatch = verifyNameMatch(
      currentUser.firstName,
      currentUser.lastName,
      unclaimedProfile.firstName,
      unclaimedProfile.lastName
    );

    if (!nameMatch) {
      return NextResponse.json(
        { 
          data: {
            claimable: false,
            reason: 'Your name does not match this profile. Only users with matching names can claim profiles.'
          }
        } as ApiResponse<{ claimable: boolean; reason: string }>,
        { status: 200 }
      );
    }

    // Profile is claimable
    return NextResponse.json(
      { 
        data: {
          claimable: true,
          reason: 'You can claim this profile',
          profileInfo: {
            firstName: unclaimedProfile.firstName,
            lastName: unclaimedProfile.lastName,
            gradYear: unclaimedProfile.gradYear,
            degreeProgram: unclaimedProfile.degreeProgram
          }
        }
      } as ApiResponse<{ 
        claimable: boolean; 
        reason: string;
        profileInfo?: {
          firstName: string;
          lastName: string;
          gradYear?: number;
          degreeProgram?: string;
        }
      }>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error checking if profile is claimable:', error);
    return NextResponse.json(
      { error: 'Failed to check if profile is claimable' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

/**
 * Verify if two names match sufficiently for claiming
 * (Same implementation as in claim route)
 */
function verifyNameMatch(
  claimingFirstName: string,
  claimingLastName: string,
  unclaimedFirstName: string,
  unclaimedLastName: string
): boolean {
  // Normalize names for comparison
  const normalize = (name: string) => name.toLowerCase().trim();
  
  const cfn = normalize(claimingFirstName);
  const cln = normalize(claimingLastName);
  const ufn = normalize(unclaimedFirstName);
  const uln = normalize(unclaimedLastName);

  // Exact match
  if (cfn === ufn && cln === uln) {
    return true;
  }

  // Last name must match exactly
  if (cln !== uln) {
    return false;
  }

  // Allow first name variations (nicknames, shortened names)
  if (cfn.startsWith(ufn) || ufn.startsWith(cfn)) {
    return true;
  }

  // Check for common nickname patterns
  const firstNameVariations = getCommonNicknames(cfn);
  if (firstNameVariations.includes(ufn)) {
    return true;
  }

  return false;
}

/**
 * Get common nickname variations for a name
 */
function getCommonNicknames(name: string): string[] {
  const nicknameMap: Record<string, string[]> = {
    'william': ['will', 'bill', 'billy'],
    'benjamin': ['ben', 'benny'],
    'michael': ['mike', 'mikey'],
    'christopher': ['chris'],
    'jonathan': ['jon', 'john'],
    'joseph': ['joe', 'joey'],
    'matthew': ['matt'],
    'nicholas': ['nick', 'nicky'],
    'robert': ['rob', 'bob', 'robbie', 'bobby'],
    'richard': ['rick', 'dick', 'ricky'],
    'daniel': ['dan', 'danny'],
    'thomas': ['tom', 'tommy'],
    'james': ['jim', 'jimmy', 'jamie'],
    'andrew': ['andy', 'drew'],
    'alexander': ['alex'],
    'elizabeth': ['liz', 'beth', 'lizzie', 'betty'],
    'katherine': ['kate', 'katie', 'kathy'],
    'jennifer': ['jen', 'jenny'],
    'jessica': ['jess', 'jessie'],
    'stephanie': ['steph'],
    'samantha': ['sam', 'sammy'],
    'rebecca': ['becca', 'becky'],
    'alexandra': ['alex', 'lexi'],
    'victoria': ['vicky', 'tori'],
  };

  // Check if this name has known nicknames
  if (nicknameMap[name]) {
    return nicknameMap[name];
  }

  // Check if this name IS a nickname
  for (const [fullName, nicknames] of Object.entries(nicknameMap)) {
    if (nicknames.includes(name)) {
      return [fullName, ...nicknames.filter(n => n !== name)];
    }
  }

  return [];
}