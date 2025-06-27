import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { userRepository } from '@/lib/repositories/users';
import type { ApiResponse } from '@/lib/types';

/**
 * POST /api/users/[id]/claim
 * Claim an unclaimed profile
 * Verifies the user can claim this profile based on name similarity
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' } as ApiResponse<never>,
        { status: 401 }
      );
    }

    const { id: unclaimedId } = await params;
    const claimingUserId = session.user.id;

    // Get both user profiles
    const [unclaimedProfile, claimingUser] = await Promise.all([
      userRepository.findById(unclaimedId),
      userRepository.findById(claimingUserId)
    ]);

    if (!unclaimedProfile) {
      return NextResponse.json(
        { error: 'Unclaimed profile not found' } as ApiResponse<never>,
        { status: 404 }
      );
    }

    if (!claimingUser) {
      return NextResponse.json(
        { error: 'User not found' } as ApiResponse<never>,
        { status: 404 }
      );
    }

    // Check if the profile is actually unclaimed
    if (!unclaimedProfile.isUnclaimed) {
      return NextResponse.json(
        { error: 'This profile has already been claimed' } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Verify name similarity
    const nameMatch = verifyNameMatch(
      claimingUser.firstName,
      claimingUser.lastName,
      unclaimedProfile.firstName,
      unclaimedProfile.lastName
    );

    if (!nameMatch) {
      return NextResponse.json(
        { error: 'You cannot claim this profile. Names do not match sufficiently.' } as ApiResponse<never>,
        { status: 403 }
      );
    }

    // Perform the claim
    await userRepository.claimProfile(unclaimedId, claimingUserId);

    return NextResponse.json(
      { 
        message: 'Profile claimed successfully',
        data: {
          claimedProfileId: unclaimedId,
          transferredAssignments: true
        }
      } as ApiResponse<{ claimedProfileId: string; transferredAssignments: boolean }>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error claiming profile:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message } as ApiResponse<never>,
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to claim profile' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

/**
 * Verify if two names match sufficiently for claiming
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
  // e.g., "William" can claim "Will", "Benjamin" can claim "Ben"
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