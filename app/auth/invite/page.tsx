import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import InviteForm from "@/components/auth/InviteForm";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";

export const metadata: Metadata = {
  title: "Send Invitation - WU Head TA Directory",
  description: "Invite a colleague to join the Washington University Head TA Directory",
};

export default async function InvitePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <Typography variant="h1">
            Invite a Colleague
          </Typography>
          <Typography variant="body" className="mt-2 text-gray-600">
            Help grow the Head TA network by inviting other head TAs
          </Typography>
        </div>

        <Card>
          <InviteForm />
        </Card>

        <div className="text-center">
          <Link href="/" className="text-sm text-charcoal hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}