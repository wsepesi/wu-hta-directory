import { Metadata } from "next";
import { redirect } from "next/navigation";
import { userRepository } from "@/lib/repositories/users";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    userId: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const user = await userRepository.findById(resolvedParams.userId);
  
  if (!user) {
    return {
      title: "User Not Found",
    };
  }

  return {
    title: `${user.firstName} ${user.lastName} - WU Head TA Directory`,
    description: `Profile of ${user.firstName} ${user.lastName}`,
  };
}

export default async function PersonProfilePage({ params }: PageProps) {
  const resolvedParams = await params;
  
  // Redirect to the new profile route structure
  redirect(`/profile/${resolvedParams.userId}`);
}