"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SemesterFiltersClientProps {
  availableYears: number[];
  yearFilter?: number;
}

export function SemesterFiltersClient({ 
  availableYears,
  yearFilter 
}: SemesterFiltersClientProps) {
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState(yearFilter?.toString() || "");

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    if (year) {
      router.push(`/semesters?year=${year}`);
    } else {
      router.push("/semesters");
    }
  };

  return (
    <div className="mb-16 border-b border-charcoal/10 pb-8">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
        <label htmlFor="year" className="font-serif text-xs sm:text-sm uppercase tracking-wider text-charcoal">
          Filter by year
        </label>
        <select
          name="year"
          id="year"
          value={selectedYear}
          onChange={(e) => handleYearChange(e.target.value)}
          className="font-serif border-b border-charcoal/20 bg-transparent text-charcoal focus:border-charcoal focus:outline-none px-2 py-1 text-sm sm:text-base"
        >
          <option value="">All years</option>
          {availableYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        {selectedYear && (
          <button
            type="button"
            onClick={() => handleYearChange("")}
            className="font-serif text-xs sm:text-sm text-charcoal/60 hover:text-charcoal transition-colors duration-200"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}