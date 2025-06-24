'use client';

import { GlobalSearch } from './GlobalSearch';
import { useRouter } from 'next/navigation';

interface SearchResult {
  id: string;
  type: 'ta' | 'course' | 'professor';
  title: string;
  subtitle?: string;
  url: string;
}

export function ConnectedGlobalSearch() {
  const router = useRouter();

  const handleSearch = async (query: string): Promise<SearchResult[]> => {
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      const results: SearchResult[] = [];

      // Transform users/TAs
      if (data.users && data.users.length > 0) {
        data.users.forEach((user: any) => {
          results.push({
            id: user.id,
            type: 'ta',
            title: `${user.firstName} ${user.lastName}`,
            subtitle: user.gradYear ? `Class of ${user.gradYear}` : user.email,
            url: `/people/${user.id}`,
          });
        });
      }

      // Transform courses
      if (data.courses && data.courses.length > 0) {
        data.courses.forEach((course: any) => {
          results.push({
            id: course.id,
            type: 'course',
            title: `${course.courseNumber}: ${course.courseName}`,
            subtitle: course.offeringPattern?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            url: `/courses/${course.courseNumber}`,
          });
        });
      }

      // Transform professors
      if (data.professors && data.professors.length > 0) {
        data.professors.forEach((professor: any) => {
          results.push({
            id: professor.id,
            type: 'professor',
            title: `${professor.firstName} ${professor.lastName}`,
            subtitle: professor.email || 'Professor',
            url: `/professors/${professor.id}`,
          });
        });
      }

      return results;
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  };

  return (
    <GlobalSearch
      onSearch={handleSearch}
      placeholder="Search for TAs, courses, or professors..."
      className="w-full max-w-md"
    />
  );
}