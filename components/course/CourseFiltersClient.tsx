"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CourseFiltersClientProps {
  searchParams?: {
    search?: string;
  };
}

export function CourseFiltersClient({ searchParams }: CourseFiltersClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(searchParams?.search || "");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append("search", searchQuery);
    router.push(`/courses?${params.toString()}`);
  };

  const handleClear = () => {
    setSearchQuery("");
    router.push("/courses");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="mb-12">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="search" className="block text-sm font-serif uppercase tracking-wider text-charcoal mb-2">
              Search
            </label>
            <input
              type="text"
              name="search"
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="block w-full border-b border-charcoal/20 bg-transparent px-0 py-2 text-charcoal placeholder-charcoal/50 focus:border-charcoal focus:outline-none transition-colors duration-200"
              placeholder="Course number or name"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          {searchQuery && (
            <button
              onClick={handleClear}
              className="text-sm font-serif uppercase tracking-wider text-charcoal hover:opacity-70 transition-opacity duration-200"
            >
              Clear
            </button>
          )}
          <button
            onClick={handleSearch}
            className="text-sm font-serif uppercase tracking-wider text-charcoal border border-charcoal px-6 py-2 hover:opacity-70 transition-opacity duration-200"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}