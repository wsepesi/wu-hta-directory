"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DirectoryFiltersClientProps {
  availableFilters: {
    gradYears: number[];
    locations: string[];
  };
  searchParams?: {
    search?: string;
    gradYear?: string;
    location?: string;
  };
}

export function DirectoryFiltersClient({ 
  availableFilters,
  searchParams 
}: DirectoryFiltersClientProps) {
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
    
    router.push(`/directory?${params.toString()}`);
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
    
    router.push(`/directory?${params.toString()}`);
  };

  return (
    <div className="bg-white border-t border-b border-charcoal/10 py-8 mb-12">
      <h2 className="font-serif text-xl text-charcoal mb-6">Search & Filter</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          type="search"
          placeholder="Search by name or course..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleFilterChange()}
          className="px-4 py-3 border border-charcoal/20 bg-white text-charcoal placeholder-charcoal/50 focus:outline-none focus:border-charcoal transition-colors font-serif"
        />
        
        <select
          value={selectedGradYear}
          onChange={(e) => handleSelectChange('gradYear', e.target.value)}
          className="px-4 py-3 border border-charcoal/20 bg-white text-charcoal focus:outline-none focus:border-charcoal transition-colors font-serif"
        >
          <option value="">All Years</option>
          {availableFilters.gradYears.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>

        <select
          value={selectedLocation}
          onChange={(e) => handleSelectChange('location', e.target.value)}
          className="px-4 py-3 border border-charcoal/20 bg-white text-charcoal focus:outline-none focus:border-charcoal transition-colors font-serif"
        >
          <option value="">All Locations</option>
          {availableFilters.locations.map(location => (
            <option key={location} value={location}>{location}</option>
          ))}
        </select>

        <button
          onClick={handleFilterChange}
          className="px-6 py-3 bg-charcoal text-white font-serif text-sm uppercase tracking-wider hover:opacity-80 transition-opacity"
        >
          Apply
        </button>
        
        {/* Clear filters button */}
        {(searchQuery || selectedGradYear || selectedLocation) && (
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedGradYear("");
              setSelectedLocation("");
              router.push("/directory?page=1");
            }}
            className="px-6 py-3 text-center text-charcoal font-serif text-sm uppercase tracking-wider hover:opacity-80 transition-opacity border border-charcoal"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}