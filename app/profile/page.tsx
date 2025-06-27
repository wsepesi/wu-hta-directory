import { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth-utils";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "My Profile - WU Head TA Directory",
  description: "View and manage your profile",
};

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    redirect("/auth/signin?callbackUrl=/profile");
  }
  
  // Redirect to the user's profile page
  redirect(`/profile/${currentUser.id}`);
}