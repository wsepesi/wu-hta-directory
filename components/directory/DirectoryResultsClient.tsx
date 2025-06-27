"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Pagination } from "@/components/ui/Pagination";

interface DirectoryEntry {
  id: string;
  firstName: string;
  lastName: string;
  gradYear: number | null;
  location: string | null;
  currentRole: string | null;
  courses: Array<{
    courseNumber: string;
    courseName: string;
    semester: string;
    professor?: string;
  }>;
}

interface DirectoryResultsClientProps {
  initialData: DirectoryEntry[];
  searchParams?: {
    search?: string;
    gradYear?: string;
    location?: string;
    page?: string;
  };
}

const ITEMS_PER_PAGE = 12;

export function DirectoryResultsClient({ 
  initialData,
  searchParams 
}: DirectoryResultsClientProps) {
  const router = useRouter();
  const urlSearchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams?.page || "1"));

  // Filter data based on current filters
  const filteredData = useMemo(() => {
    const searchQuery = searchParams?.search || "";
    const selectedGradYear = searchParams?.gradYear || "";
    const selectedLocation = searchParams?.location || "";

    return initialData.filter(entry => {
      const matchesSearch = !searchQuery || 
        `${entry.firstName} ${entry.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.currentRole?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.courses.some(c => 
          c.courseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.courseName.toLowerCase().includes(searchQuery.toLowerCase())
        );
      
      const matchesGradYear = !selectedGradYear || entry.gradYear?.toString() === selectedGradYear;
      const matchesLocation = !selectedLocation || entry.location === selectedLocation;

      return matchesSearch && matchesGradYear && matchesLocation;
    });
  }, [initialData, searchParams]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(urlSearchParams.toString());
    params.set("page", page.toString());
    router.push(`/directory?${params.toString()}`);
    setCurrentPage(page);
  };

  const clearFilters = () => {
    router.push('/directory');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Results */}
      <div>
        <div className="flex justify-between items-center mb-8">
          <p className="font-serif text-charcoal">
            Showing {paginatedData.length} of {filteredData.length} results
          </p>
        </div>

        {paginatedData.length > 0 ? (
          <div className="space-y-8">
            {paginatedData.map(entry => (
              <div key={entry.id} className="border-b border-charcoal/10 pb-8 last:border-0">
                <h3 className="font-serif text-2xl text-charcoal mb-2">
                  {entry.firstName} {entry.lastName}
                </h3>
                <div className="font-serif text-charcoal/70 space-y-1">
                  {entry.gradYear && (
                    <p>Class of {entry.gradYear}</p>
                  )}
                  {entry.currentRole && (
                    <p>{entry.currentRole}</p>
                  )}
                  {entry.location && (
                    <p>{entry.location}</p>
                  )}
                </div>
                
                {entry.courses.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-serif text-sm uppercase tracking-wider text-charcoal mb-2">Teaching Experience</h4>
                    <ul className="font-serif text-charcoal/70 space-y-1">
                      {entry.courses.slice(0, 3).map((course, idx) => (
                        <li key={idx}>
                          {course.courseNumber}: {course.courseName}
                          {course.professor && (
                            <span className="text-charcoal/50"> with {course.professor}</span>
                          )}
                        </li>
                      ))}
                      {entry.courses.length > 3 && (
                        <li className="text-charcoal/50 italic">
                          +{entry.courses.length - 3} more courses
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="font-serif text-2xl text-charcoal mb-4">No TAs Found</p>
            <p className="font-serif text-charcoal/70 mb-8">
              Try adjusting your search criteria or browse all TAs.
            </p>
            <button
              onClick={clearFilters}
              className="font-serif text-sm uppercase tracking-wider text-charcoal hover:opacity-70 transition-opacity"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-12 pt-8 border-t border-charcoal/10">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            showFirstLast={false}
            maxVisiblePages={5}
          />
        </div>
      )}
    </div>
  );
}