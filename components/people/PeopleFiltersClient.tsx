"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PeopleFiltersClientProps {
  availableFilters: {
    gradYears: (number | null)[];
    locations: (string | null)[];
  };
  searchParams?: {
    search?: string;
    gradYear?: string;
    location?: string;
  };
}

export function PeopleFiltersClient({ 
  availableFilters,
  searchParams 
}: PeopleFiltersClientProps) {
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState(searchParams?.search || "");
  const [selectedGradYear, setSelectedGradYear] = useState(searchParams?.gradYear || "");
  const [selectedLocation, setSelectedLocation] = useState(searchParams?.location || "");

  const handleFilterChange = () => {
    // Update URL with new filters
    const params = new URLSearchParams();
    if (searchQuery) params.append("search", searchQuery);
    if (selectedGradYear) params.append("gradYear", selectedGradYear);
    if (selectedLocation) params.append("location", selectedLocation);
    params.append("page", "1"); // Reset to first page on filter change
    
    router.push(`/people?${params.toString()}`);
  };

  const handleSelectChange = (type: 'gradYear' | 'location', value: string) => {
    if (type === 'gradYear') {
      setSelectedGradYear(value);
    } else {
      setSelectedLocation(value);
    }
    
    // Auto-apply filter on select change
    const params = new URLSearchParams();
    if (searchQuery) params.append("search", searchQuery);
    if (type === 'gradYear' ? value : selectedGradYear) {
      params.append("gradYear", type === 'gradYear' ? value : selectedGradYear);
    }
    if (type === 'location' ? value : selectedLocation) {
      params.append("location", type === 'location' ? value : selectedLocation);
    }
    params.append("page", "1");
    
    router.push(`/people?${params.toString()}`);
  };

  const handleClear = () => {
    setSearchQuery("");
    setSelectedGradYear("");
    setSelectedLocation("");
    router.push("/people");
  };

  const hasActiveFilters = searchQuery || selectedGradYear || selectedLocation;

  return (
    <div className="bg-white border-t border-b border-charcoal/10 py-8 mb-12">
      <div className="space-y-6">
        <div>
          <label htmlFor="search" className="font-serif text-sm uppercase tracking-wider text-charcoal block mb-2">
            Search
          </label>
          <input
            type="text"
            name="search"
            id="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleFilterChange()}
            className="w-full px-4 py-3 border border-charcoal/20 bg-white text-charcoal placeholder-charcoal/50 focus:outline-none focus:border-charcoal transition-colors font-serif"
            placeholder="Search by name or email..."
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="gradYear" className="font-serif text-sm uppercase tracking-wider text-charcoal block mb-2">
              Graduation Year
            </label>
            <select
              name="gradYear"
              id="gradYear"
              value={selectedGradYear}
              onChange={(e) => handleSelectChange('gradYear', e.target.value)}
              className="w-full px-4 py-3 border border-charcoal/20 bg-white text-charcoal focus:outline-none focus:border-charcoal transition-colors font-serif"
            >
              <option value="">All years</option>
              {availableFilters.gradYears.filter(year => year !== null).map((year) => (
                <option key={year} value={year!}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="location" className="font-serif text-sm uppercase tracking-wider text-charcoal block mb-2">
              Location
            </label>
            <select
              name="location"
              id="location"
              value={selectedLocation}
              onChange={(e) => handleSelectChange('location', e.target.value)}
              className="w-full px-4 py-3 border border-charcoal/20 bg-white text-charcoal focus:outline-none focus:border-charcoal transition-colors font-serif"
            >
              <option value="">All locations</option>
              {availableFilters.locations.filter(location => location !== null).map((location) => (
                <option key={location} value={location!}>
                  {location}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={handleFilterChange}
            className="px-6 py-3 bg-charcoal text-white font-serif text-sm uppercase tracking-wider hover:opacity-80 transition-opacity"
          >
            Apply
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClear}
              className="px-6 py-3 text-center text-charcoal font-serif text-sm uppercase tracking-wider hover:opacity-80 transition-opacity border border-charcoal"
            >
              Clear All
            </button>
          )}
        </div>
      </div>
    </div>
  );
}