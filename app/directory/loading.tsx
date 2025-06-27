import CleanLayout, { CleanPageHeader } from "@/components/layout/CleanLayout";
import { DirectoryFiltersSkeleton } from "@/components/directory/DirectoryFiltersSkeleton";
import { DirectoryResultsSkeleton } from "@/components/directory/DirectoryResultsSkeleton";
import { DirectoryStatsSkeleton } from "@/components/directory/DirectoryStatsSkeleton";
import Link from "next/link";

export default function DirectoryLoading() {
  return (
    <CleanLayout maxWidth="6xl" center>
      <CleanPageHeader
        title="Head TA Directory"
        subtitle="Washington University Computer Science Head Teaching Assistants"
        description="Browse our directory of head teaching assistants. For full access to contact information and additional features, please sign in."
      />

      <div className="space-y-6">
        {/* Stats skeleton */}
        <DirectoryStatsSkeleton />

        {/* Filters skeleton */}
        <DirectoryFiltersSkeleton />

        {/* Results skeleton */}
        <DirectoryResultsSkeleton />
      </div>

      <div className="mt-16 font-serif text-charcoal space-y-6">
        <p className="text-lg">
          Are you a head TA? Join the directory to connect with fellow TAs.
        </p>
        <nav className="font-serif space-y-4 sm:space-y-0 sm:space-x-12 sm:flex sm:justify-center">
          <Link
            href="/auth/signin"
            className="text-sm uppercase tracking-wider text-charcoal hover:opacity-70 transition-opacity duration-200"
          >
            Sign In
          </Link>
          <Link
            href="/"
            className="text-sm uppercase tracking-wider text-charcoal hover:opacity-70 transition-opacity duration-200"
          >
            Back to Home
          </Link>
        </nav>
      </div>
    </CleanLayout>
  );
}