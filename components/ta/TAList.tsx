'use client';

import { useState, useMemo } from 'react';
import { TACard } from './TACard';
import { Input } from '../ui/Input';
import { BodyText } from '../ui/Typography';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorMessage } from '../ui/ErrorMessage';
import { clsx } from 'clsx';

interface TA {
  id: string;
  name: string;
  email: string;
  major?: string;
  year?: string;
  courses: Array<{
    id: string;
    name: string;
    code: string;
    semester: string;
  }>;
  imageUrl?: string;
  bio?: string;
  availability?: string;
}

interface TAListProps {
  tas: TA[];
  loading?: boolean;
  error?: string;
  onContactTA?: (ta: TA) => void;
  onViewTADetails?: (ta: TA) => void;
  className?: string;
}

export function TAList({ 
  tas, 
  loading = false,
  error,
  onContactTA,
  onViewTADetails,
  className 
}: TAListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMajor, setSelectedMajor] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  // Extract unique majors and years for filters
  const filters = useMemo(() => {
    const majors = new Set<string>();
    const years = new Set<string>();
    
    tas.forEach(ta => {
      if (ta.major) majors.add(ta.major);
      if (ta.year) years.add(ta.year);
    });

    return {
      majors: Array.from(majors).sort(),
      years: Array.from(years).sort()
    };
  }, [tas]);

  // Filter TAs based on search and filters
  const filteredTAs = useMemo(() => {
    return tas.filter(ta => {
      const matchesSearch = searchQuery === '' || 
        ta.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ta.courses.some(course => 
          course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.code.toLowerCase().includes(searchQuery.toLowerCase())
        );
      
      const matchesMajor = selectedMajor === '' || ta.major === selectedMajor;
      const matchesYear = selectedYear === '' || ta.year === selectedYear;

      return matchesSearch && matchesMajor && matchesYear;
    });
  }, [tas, searchQuery, selectedMajor, selectedYear]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage variant="error">{error}</ErrorMessage>;
  }

  return (
    <div className={clsx('space-y-6', className)}>
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            type="search"
            placeholder="Search by name or course..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          <select
            value={selectedMajor}
            onChange={(e) => setSelectedMajor(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-charcoal focus:border-transparent"
          >
            <option value="">All Majors</option>
            {filters.majors.map(major => (
              <option key={major} value={major}>{major}</option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-charcoal focus:border-transparent"
          >
            <option value="">All Years</option>
            {filters.years.map(year => (
              <option key={year} value={year}>Class of {year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      <BodyText className="text-sm text-gray-600">
        Showing {filteredTAs.length} of {tas.length} TAs
      </BodyText>

      {/* TA Grid */}
      {filteredTAs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTAs.map(ta => (
            <TACard
              key={ta.id}
              ta={ta}
              onContact={onContactTA ? () => onContactTA(ta) : undefined}
              onViewDetails={onViewTADetails ? () => onViewTADetails(ta) : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <BodyText className="text-gray-500">
            No TAs found matching your criteria.
          </BodyText>
        </div>
      )}
    </div>
  );
}