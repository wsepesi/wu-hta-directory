'use client';

import { useState, useMemo } from 'react';
import { TACard } from '../ta/TACard';
import { Input } from '../ui/Input';
import { Card, CardBody } from '../ui/Card';
import { ScriptHeading, SerifHeading, BodyText } from '../ui/Typography';
import { Skeleton, SkeletonCard } from '../ui/Skeleton';
import { ErrorMessage } from '../ui/ErrorMessage';
import { clsx } from 'clsx';

interface PublicTA {
  id: string;
  name: string;
  email: string;
  major?: string;
  year?: string;
  bio?: string;
  imageUrl?: string;
  courses: Array<{
    id: string;
    code: string;
    name: string;
    semester: string;
  }>;
  availability?: string;
}

interface PublicDirectoryProps {
  tas: PublicTA[];
  loading?: boolean;
  error?: string;
  className?: string;
}

export function PublicDirectory({ 
  tas, 
  loading = false,
  error,
  className 
}: PublicDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedMajor, setSelectedMajor] = useState('');

  // Extract unique courses and majors for filters
  const filters = useMemo(() => {
    const courses = new Map<string, string>();
    const majors = new Set<string>();
    
    tas.forEach(ta => {
      if (ta.major) majors.add(ta.major);
      ta.courses.forEach(course => {
        courses.set(course.code, course.name);
      });
    });

    return {
      courses: Array.from(courses, ([code, name]) => ({ code, name })).sort((a, b) => 
        a.code.localeCompare(b.code)
      ),
      majors: Array.from(majors).sort()
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
      
      const matchesCourse = selectedCourse === '' || 
        ta.courses.some(course => course.code === selectedCourse);
      
      const matchesMajor = selectedMajor === '' || ta.major === selectedMajor;

      return matchesSearch && matchesCourse && matchesMajor;
    });
  }, [tas, searchQuery, selectedCourse, selectedMajor]);

  const handleContactTA = (ta: PublicTA) => {
    window.location.href = `mailto:${ta.email}`;
  };

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Header skeleton */}
        <div className="text-center">
          <Skeleton className="h-12 w-64 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>

        {/* Filters skeleton */}
        <SkeletonCard>
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          </div>
        </SkeletonCard>

        {/* TA cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <SkeletonCard key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorMessage variant="error">{error}</ErrorMessage>;
  }

  return (
    <div className={clsx('space-y-8', className)}>
      {/* Header */}
      <div className="text-center">
        <ScriptHeading className="mb-4">TA Directory</ScriptHeading>
        <BodyText className="text-lg text-gray-600 max-w-2xl mx-auto">
          Connect with our talented Teaching Assistants. Browse by course, major, or search for specific TAs.
        </BodyText>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="space-y-4">
            <SerifHeading className="text-lg">Find a TA</SerifHeading>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                type="search"
                placeholder="Search by name or course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-charcoal focus:border-transparent"
              >
                <option value="">All Courses</option>
                {filters.courses.map(course => (
                  <option key={course.code} value={course.code}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>

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
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Results */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <BodyText className="text-gray-600">
            Showing {filteredTAs.length} of {tas.length} TAs
          </BodyText>
        </div>

        {filteredTAs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTAs.map(ta => (
              <TACard
                key={ta.id}
                ta={ta}
                onContact={() => handleContactTA(ta)}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardBody>
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 mb-4"
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
                <SerifHeading className="text-xl mb-2">No TAs Found</SerifHeading>
                <BodyText className="text-gray-500">
                  Try adjusting your search criteria or browse all TAs.
                </BodyText>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}