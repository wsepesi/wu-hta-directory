import { Metadata } from "next";
import CleanLayout, { CleanPageHeader } from "@/components/layout/CleanLayout";
import Link from "next/link";
import { searchAll } from "@/lib/search-logic";

export const metadata: Metadata = {
  title: "Search Results - WU Head TA Directory",
  description: "Search results for Washington University Head TAs, courses, and professors",
};

interface SearchPageProps {
  searchParams?: Promise<{
    q?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams?.q || "";

  // Get search results if query exists
  let results = null;
  if (query) {
    try {
      // For server-side rendering, call the search function directly
      results = await searchAll(query);
    } catch (error) {
      console.error('Search error:', error);
      results = { users: [], courses: [], professors: [] };
    }
  }

  return (
    <CleanLayout maxWidth="4xl" center>
      <CleanPageHeader
        title="Search Results"
        subtitle={query ? `Results for "${query}"` : "Enter a search query"}
      />

      {/* Search Form */}
      <form method="GET" action="/search" className="mb-12">
        <div className="flex gap-4">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search for TAs, courses, or professors..."
            className="flex-1 px-4 py-3 border border-charcoal/20 bg-white text-charcoal placeholder-charcoal/50 focus:outline-none focus:border-charcoal transition-colors font-serif"
            required
          />
          <button
            type="submit"
            className="px-6 py-3 bg-charcoal text-white font-serif text-sm uppercase tracking-wider hover:opacity-80 transition-opacity"
          >
            Search
          </button>
        </div>
      </form>

      {/* Search Results */}
      {results && (
        <div className="space-y-12">
          {/* TAs */}
          {results.users.length > 0 && (
            <section>
              <h2 className="font-serif text-xl text-charcoal mb-6 uppercase tracking-wider">
                Teaching Assistants ({results.users.length})
              </h2>
              <div className="space-y-4">
                {results.users.map((user) => (
                  <Link
                    key={user.id}
                    href={`/profile/${user.id}`}
                    className="block border-b border-charcoal/10 pb-4 hover:opacity-70 transition-opacity"
                  >
                    <h3 className="font-serif text-lg text-charcoal">
                      {user.firstName} {user.lastName}
                    </h3>
                    <p className="font-serif text-sm text-charcoal/70">
                      {user.gradYear && `Class of ${user.gradYear}`}
                      {user.email && ` • ${user.email}`}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Courses */}
          {results.courses.length > 0 && (
            <section>
              <h2 className="font-serif text-xl text-charcoal mb-6 uppercase tracking-wider">
                Courses ({results.courses.length})
              </h2>
              <div className="space-y-4">
                {results.courses.map((course) => (
                  <Link
                    key={course.id}
                    href={`/courses/${course.courseNumber}`}
                    className="block border-b border-charcoal/10 pb-4 hover:opacity-70 transition-opacity"
                  >
                    <h3 className="font-serif text-lg text-charcoal">
                      {course.courseNumber}: {course.courseName}
                    </h3>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Professors */}
          {results.professors.length > 0 && (
            <section>
              <h2 className="font-serif text-xl text-charcoal mb-6 uppercase tracking-wider">
                Professors ({results.professors.length})
              </h2>
              <div className="space-y-4">
                {results.professors.map((professor) => (
                  <Link
                    key={professor.id}
                    href={`/professors/${professor.id}`}
                    className="block border-b border-charcoal/10 pb-4 hover:opacity-70 transition-opacity"
                  >
                    <h3 className="font-serif text-lg text-charcoal">
                      {professor.firstName} {professor.lastName}
                    </h3>
                    {professor.email && (
                      <p className="font-serif text-sm text-charcoal/70">{professor.email}</p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* No results */}
          {results.users.length === 0 && 
           results.courses.length === 0 && 
           results.professors.length === 0 && (
            <p className="font-serif text-charcoal/70 text-center py-12">
              No results found for &quot;{query}&quot;
            </p>
          )}
        </div>
      )}

      {/* No query */}
      {!query && (
        <p className="font-serif text-charcoal/70 text-center py-12">
          Enter a search term to find TAs, courses, or professors.
        </p>
      )}

      <div className="mt-16 text-center">
        <Link
          href="/"
          className="font-serif text-sm uppercase tracking-wider text-charcoal hover:opacity-70 transition-opacity duration-200"
        >
          Back to home
        </Link>
      </div>
    </CleanLayout>
  );
}