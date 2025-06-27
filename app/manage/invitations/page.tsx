import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { invitationRepository } from "@/lib/repositories/invitations";
import CleanLayout, { CleanPageHeader } from "@/components/layout/CleanLayout";
import { InvitationsContent } from "./InvitationsContent";

export const metadata: Metadata = {
  title: "Manage Invitations - WU Head TA Directory",
  description: "Track and manage invitations you've sent",
};

export default async function ManageInvitationsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Fetch user's invitations
  const invitations = await invitationRepository.findByInviter(session.user.id);

  // Categorize invitations
  const pending = invitations.filter(
    (inv) => !inv.usedAt && new Date(inv.expiresAt) > new Date()
  );
  const used = invitations.filter((inv) => inv.usedAt);
  const expired = invitations.filter(
    (inv) => !inv.usedAt && new Date(inv.expiresAt) <= new Date()
  );

  return (
    <CleanLayout maxWidth="6xl">
      <CleanPageHeader
        title="My Invitations"
        description="Track and manage invitations you've sent"
      />

      <InvitationsContent
        pending={pending}
        used={used}
        expired={expired}
      />
    </CleanLayout>
  );
}