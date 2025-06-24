"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { EnhancedInput } from "@/components/ui/EnhancedInput";
import { CardSkeleton } from "@/components/ui/SkeletonLoader";

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

interface PublicDirectoryClientProps {
  initialData: DirectoryEntry[];
  availableFilters: {
    gradYears: number[];
    locations: string[];
  };
  searchParams?: {
    search?: string;
    gradYear?: string;
    location?: string;
    page?: string;
  };
}

const ITEMS_PER_PAGE = 12;

export default function PublicDirectoryClient({ 
  initialData, 
  availableFilters,
  searchParams 
}: PublicDirectoryClientProps) {
  const router = useRouter();
  const urlSearchParams = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState(searchParams?.search || "");
  const [selectedGradYear, setSelectedGradYear] = useState(searchParams?.gradYear || "");
  const [selectedLocation, setSelectedLocation] = useState(searchParams?.location || "");
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams?.page || "1"));

  // Filter data based on current filters
  const filteredData = useMemo(() => {
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
  }, [initialData, searchQuery, selectedGradYear, selectedLocation]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleFilterChange = () => {
    // Update URL with new filters
    const params = new URLSearchParams();
    if (searchQuery) params.append("search", searchQuery);
    if (selectedGradYear) params.append("gradYear", selectedGradYear);
    if (selectedLocation) params.append("location", selectedLocation);
    params.append("page", "1"); // Reset to first page on filter change
    
    router.push(`/directory?${params.toString()}`);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(urlSearchParams.toString());
    params.set("page", page.toString());
    router.push(`/directory?${params.toString()}`);
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Find Head TAs</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <EnhancedInput
            type="search"
            placeholder="Search by name or course..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleFilterChange()}
            clearable
            onClear={() => {
              setSearchQuery("");
              handleFilterChange();
            }}
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
          
          <select
            value={selectedGradYear}
            onChange={(e) => {
              setSelectedGradYear(e.target.value);
              handleFilterChange();
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Years</option>
            {availableFilters.gradYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          <select
            value={selectedLocation}
            onChange={(e) => {
              setSelectedLocation(e.target.value);
              handleFilterChange();
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Locations</option>
            {availableFilters.locations.map(location => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>

          <button
            onClick={handleFilterChange}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Search
          </button>
        </div>
      </div>

      {/* Results */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-600">
            Showing {paginatedData.length} of {filteredData.length} results
          </p>
        </div>

        {paginatedData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedData.map(entry => (
              <div key={entry.id} className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {entry.firstName} {entry.lastName}
                </h3>
                {entry.gradYear && (
                  <p className="text-sm text-gray-500">Class of {entry.gradYear}</p>
                )}
                {entry.currentRole && (
                  <p className="text-sm text-gray-600 mt-1">{entry.currentRole}</p>
                )}
                {entry.location && (
                  <p className="text-sm text-gray-500 mt-1">{entry.location}</p>
                )}
                
                {entry.courses.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Courses</h4>
                    <ul className="space-y-1">
                      {entry.courses.slice(0, 3).map((course, idx) => (
                        <li key={idx} className="text-sm text-gray-600">
                          {course.courseNumber}: {course.courseName}
                          {course.professor && (
                            <span className="text-gray-500"> - {course.professor}</span>
                          )}
                        </li>
                      ))}
                      {entry.courses.length > 3 && (
                        <li className="text-sm text-gray-500">
                          +{entry.courses.length - 3} more
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={
              <svg
                className="h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            }
            title="No TAs Found"
            description="Try adjusting your search criteria or browse all TAs."
            action={{
              label: "Clear Filters",
              onClick: () => {
                setSearchQuery("");
                setSelectedGradYear("");
                setSelectedLocation("");
                handleFilterChange();
              },
            }}
          />
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          className="mt-8"
        />
      )}
    </div>
  );
}