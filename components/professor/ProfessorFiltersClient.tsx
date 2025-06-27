"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ProfessorFiltersClientProps {
  searchParams?: {
    search?: string;
  };
}

export function ProfessorFiltersClient({ searchParams }: ProfessorFiltersClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(searchParams?.search || "");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append("search", searchQuery);
    router.push(`/professors?${params.toString()}`);
  };

  const handleClear = () => {
    setSearchQuery("");
    router.push("/professors");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <section className="mb-12">
      <div className="max-w-2xl mx-auto">
        <label htmlFor="search" className="font-serif text-sm uppercase tracking-wider text-charcoal/60 block mb-2">
          Search professors
        </label>
        <div className="flex">
          <input
            type="text"
            name="search"
            id="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-white border-b border-charcoal focus:border-charcoal focus:outline-none font-serif text-lg px-0 py-2"
            placeholder="Search by name or email..."
          />
          <button
            type="button"
            onClick={handleSearch}
            className="ml-6 font-serif text-sm uppercase tracking-wider text-charcoal hover:opacity-70 transition-opacity duration-200"
          >
            Search
          </button>
          {searchQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="ml-6 font-serif text-sm uppercase tracking-wider text-charcoal/60 hover:text-charcoal transition-colors duration-200"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </section>
  );
}