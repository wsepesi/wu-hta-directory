"use client";

import { useState, useEffect, useRef } from "react";
import { Skeleton } from "../ui/Skeleton";
import { debounce } from "lodash";

interface SearchResult {
  id: string;
  type: "ta" | "course" | "professor";
  title: string;
  subtitle?: string;
  url: string;
}

interface SearchWithHighlightProps {
  placeholder?: string;
  className?: string;
  onResultClick?: (result: SearchResult) => void;
}

export function SearchWithHighlight({ 
  placeholder = "Search TAs, courses, or professors...",
  className = "",
  onResultClick
}: SearchWithHighlightProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search function
  const debouncedSearch = debounce(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();
      const searchResults: SearchResult[] = [];

      // Transform and combine results
      if (data.data) {
        if (data.data.users) {
          data.data.users.forEach((user: unknown) => {
            const typedUser = user as { id: string; firstName: string; lastName: string; gradYear?: number; email: string };
            searchResults.push({
              id: typedUser.id,
              type: "ta",
              title: `${typedUser.firstName} ${typedUser.lastName}`,
              subtitle: typedUser.gradYear ? `Class of ${typedUser.gradYear}` : typedUser.email,
              url: `/profile/${typedUser.id}`,
            });
          });
        }

        if (data.data.courses) {
          data.data.courses.forEach((course: unknown) => {
            const typedCourse = course as { id: string; courseNumber: string; courseName: string };
            searchResults.push({
              id: typedCourse.id,
              type: "course",
              title: `${typedCourse.courseNumber}: ${typedCourse.courseName}`,
              subtitle: undefined,
              url: `/courses/${typedCourse.courseNumber}`,
            });
          });
        }

        if (data.data.professors) {
          data.data.professors.forEach((professor: unknown) => {
            const typedProfessor = professor as { id: string; firstName: string; lastName: string; email?: string };
            searchResults.push({
              id: typedProfessor.id,
              type: "professor",
              title: `${typedProfessor.firstName} ${typedProfessor.lastName}`,
              subtitle: typedProfessor.email || "Professor",
              url: `/professors/${typedProfessor.id}`,
            });
          });
        }
      }

      setResults(searchResults.slice(0, 8)); // Limit to 8 results
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, 300);

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setQuery(value);
    setSelectedIndex(-1);
    if (value.length >= 2) {
      debouncedSearch(value);
      setShowResults(true);
    } else {
      setResults([]);
      setShowResults(false);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleResultClick(results[selectedIndex]);
        }
        break;
      case "Escape":
        setShowResults(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    if (onResultClick) {
      onResultClick(result);
    } else {
      window.location.href = result.url;
    }
    setQuery("");
    setResults([]);
    setShowResults(false);
  };

  // Highlight matching text
  const highlightMatch = (text: string, query: string) => {
    const regex = new RegExp(`(${query})`, "gi");
    const parts = text.split(regex);
    
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 font-semibold">
          {part}
        </mark>
      ) : (
        <span key={index}>{part}</span>
      )
    );
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "ta":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case "course":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case "professor":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => handleSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          placeholder={placeholder}
          className="w-full px-4 py-2 pl-10 pr-4 text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <div className="absolute inset-y-0 left-0 flex items-center pl-3">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        {loading && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <div className="w-5 h-5">
              <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (results.length > 0 || loading) && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
          {loading && results.length === 0 ? (
            <div className="py-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-4 py-3 flex items-start">
                  <Skeleton variant="circular" width={16} height={16} className="mr-3 mt-0.5" />
                  <div className="flex-1">
                    <Skeleton variant="text" width="70%" className="h-4 mb-1" />
                    <Skeleton variant="text" width="40%" className="h-3" />
                  </div>
                  <Skeleton variant="rectangular" width={40} height={16} className="rounded ml-2" />
                </div>
              ))}
            </div>
          ) : (
            <ul className="py-2">
              {results.map((result, index) => (
                <li key={result.id}>
                  <button
                    onClick={() => handleResultClick(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full px-4 py-3 flex items-start hover:bg-gray-50 transition-colors ${
                      index === selectedIndex ? "bg-gray-50" : ""
                    }`}
                  >
                    <div className={`mr-3 mt-0.5 ${
                      result.type === "ta" ? "text-blue-600" :
                      result.type === "course" ? "text-green-600" :
                      "text-purple-600"
                    }`}>
                      {getTypeIcon(result.type)}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-gray-900">
                        {highlightMatch(result.title, query)}
                      </div>
                      {result.subtitle && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {highlightMatch(result.subtitle, query)}
                        </div>
                      )}
                    </div>
                    <div className="ml-2 text-xs text-gray-400 capitalize">
                      {result.type === "ta" ? "TA" : result.type}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          
          {results.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500">
                Press <kbd className="px-1 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">↑</kbd> <kbd className="px-1 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">↓</kbd> to navigate, <kbd className="px-1 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">Enter</kbd> to select
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}