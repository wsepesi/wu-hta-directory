# Verbiage and Workflow Reframing Plan

## Overview

Transform the application from an active TA recruitment/assignment system to a historical/current state recording system where:
- "Missing TA" = No HTA recorded for a course offering OR HTA recorded but account unclaimed
- "Assignment" = Recording who was/is the HTA (creating an unclaimed profile)
- "Invitation" = Optional action to invite an unclaimed HTA to claim their account

## Core Concept Changes

### 1. Missing TA Definition
**Current**: Courses that need someone to teach as HTA
**New**: Course offerings lacking recorded HTA information

### 2. Assignment → Recording
**Current**: Assigning someone to teach a course
**New**: Recording/documenting who was/is the HTA for a course

### 3. Invitation Separation
**Current**: Recording an HTA automatically sends invitation email
**New**: Two separate actions:
   - Record HTA (creates unclaimed profile if needed)
   - Invite to claim account (optional, manual action)

## Implementation Steps

### Phase 1: Database & Backend Changes

1. **Modify TA Assignment Creation Flow**
   - Add `autoInvite` boolean parameter (default: false)
   - Create unclaimed user profiles without sending emails
   - Track invitation status separately from assignment status

2. **Update Unclaimed Profile System**
   - Enhance unclaimed profile creation to support silent creation
   - Add `invitationSent` timestamp to track if/when invited
   - Add `recordedBy` and `recordedAt` to track who documented the HTA

3. **Separate Invitation Logic**
   - Create new endpoint: `/api/users/[id]/send-claim-invitation`
   - Move email sending out of assignment creation
   - Add bulk invitation capability for multiple unclaimed profiles

### Phase 2: UI/UX Verbiage Updates

#### A. Missing TA Dashboard (`/app/dashboard/missing-tas/page.tsx`)
```
OLD: "Courses Missing TAs"
NEW: "Courses Without Recorded HTAs"

OLD: "View courses that need Head TA assignments"
NEW: "View courses lacking Head TA documentation"

OLD: "Help identify and fill open TA positions"
NEW: "Help complete our historical records"

OLD: "Want to help fill these positions?"
NEW: "Know who taught these courses?"
```

#### B. TA Assignment Modal → TA Recording Modal (`/components/course/TAAssignmentModal.tsx`)
```
OLD: "Assign Head TA"
NEW: "Record Head TA"

OLD: "Assign TA"
NEW: "Record HTA"

OLD: "Suggested TAs" 
NEW: "Previously Recorded HTAs" or "Existing HTA Profiles"

Remove: Workload tracking (not relevant for historical records)
Add: "Send invitation to claim profile" checkbox (unchecked by default)
```

#### C. Missing TA Widget (`/components/dashboard/MissingTAWidget.tsx`)
```
OLD: "X courses need head TAs assigned"
NEW: "X courses missing HTA records"

OLD: "All courses have TAs assigned!"
NEW: "All courses have HTA records!"

OLD: "Waiting for X days"
NEW: "Unrecorded for X days" or "Missing record for X days"

OLD: "Invite TA →"
NEW: "Record HTA →"
```

#### D. Notification Service (`/lib/notification-service.ts`)
```
OLD: "You've been assigned as a Head TA!"
NEW: "You've been recorded as a Head TA - claim your profile!"

OLD: "TA Assignment Removed"
NEW: "HTA Record Updated"

Rename functions:
- notifyTAAssignment → notifyProfileClaimAvailable
- notifyTARemoval → notifyRecordUpdate
```

#### E. Email Templates (`/lib/invitation-templates.ts`)
```
OLD: "TA Opportunity: {courseNumber}"
NEW: "Claim Your HTA Profile for {courseNumber}"

OLD: "is looking for a teaching assistant and thought you might be interested!"
NEW: "You've been recorded as the Head TA for this course. Claim your profile to manage your information!"
```

### Phase 3: Workflow Changes

#### 1. Recording an HTA (No Auto-Email)
```typescript
// New workflow in TAAssignmentModal
const recordHTA = async (data) => {
  // Step 1: Create/find unclaimed profile
  const profile = await createUnclaimedProfile({
    name: data.taName,
    email: data.taEmail,
    recordedBy: currentUser.id,
    autoInvite: false // NEW: Don't send email
  });
  
  // Step 2: Create TA assignment record
  await createTAAssignment({
    userId: profile.id,
    courseOfferingId: offering.id,
    recordedAt: new Date()
  });
  
  // Step 3: Show success with option to invite
  toast.success(
    "HTA recorded successfully",
    {
      action: {
        label: "Send invitation",
        onClick: () => sendClaimInvitation(profile.id)
      }
    }
  );
};
```

#### 2. Bulk Invitation Management
Create new admin page: `/app/admin/unclaimed-profiles/page.tsx`
- List all unclaimed profiles
- Show invitation status
- Bulk select and invite
- Track invitation history

#### 3. Course Page Updates
```typescript
// Show different states
if (!offering.hta) {
  return <Badge>No HTA Recorded</Badge>;
} else if (!offering.hta.claimedAt) {
  return (
    <div>
      <Badge>Unclaimed Profile</Badge>
      {!offering.hta.invitationSent && (
        <Button size="sm" onClick={sendInvitation}>
          Send Invitation
        </Button>
      )}
    </div>
  );
} else {
  return <HTAProfile user={offering.hta} />;
}
```

### Phase 4: New Features

1. **Bulk HTA Recording**
   - Upload CSV with historical HTA data
   - Create unclaimed profiles in bulk
   - No automatic emails

2. **Invitation Management Dashboard**
   - Track sent/pending invitations
   - Resend invitations
   - Invitation analytics

3. **Record Source Tracking**
   - Track how HTA info was obtained (manual, import, etc.)
   - Add notes field for additional context

### Phase 5: Language Cleanup

#### File/Component Renames
- `TAAssignmentModal` → `HTARecordingModal`
- `BatchTAAssignment` → `BulkHTARecording`
- `missing-tas` → `missing-records`
- `ta-assignment-logic` → `hta-record-logic`

#### Variable/Function Renames
- `assignTA()` → `recordHTA()`
- `removeAssignment()` → `removeRecord()`
- `needsTAs` → `missingHTARecord`
- `suggestedTAs` → `existingHTAProfiles`

#### API Endpoint Renames
- `/api/ta-assignments` → `/api/hta-records`
- `/api/ta-assignments/assign` → `/api/hta-records/create`
- `/api/users/[id]/claim` remains the same

## Migration Strategy

1. **Phase 1**: Backend changes (non-breaking)
2. **Phase 2**: Add new UI alongside old (feature flags)
3. **Phase 3**: Gradual UI text updates
4. **Phase 4**: Remove old workflows
5. **Phase 5**: Clean up naming conventions

## Success Metrics

- Clear separation between recording HTAs and inviting them
- No confusion about "assigning" vs "recording"
- Reduced accidental emails to unclaimed profiles
- Better tracking of historical HTA data
- Clear distinction between "missing record" and "unclaimed profile"