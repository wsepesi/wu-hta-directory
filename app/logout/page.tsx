"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";
import CleanLayout from "@/components/layout/CleanLayout";
import { Skeleton } from "@/components/ui/Skeleton";

export default function LogoutPage() {
  useEffect(() => {
    // Immediately sign out and redirect to home page
    signOut({ redirect: true, callbackUrl: "/" });
  }, []);

  return (
    <CleanLayout center>
      <div className="flex flex-col items-center justify-center space-y-4">
        <Skeleton variant="circular" width={64} height={64} animation="pulse" />
        <p className="text-lg text-charcoal">Signing out...</p>
      </div>
    </CleanLayout>
  );
}