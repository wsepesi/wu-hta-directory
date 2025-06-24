'use client';

import { useMemo } from 'react';
import { SerifHeading, BodyText } from '../ui/Typography';
import { clsx } from 'clsx';

interface Course {
  id: string;
  code: string;
  name: string;
  semester: string;
  year: number;
  startDate: Date;
  endDate: Date;
  tas: { id: string; name: string }[];
  maxTAs: number;
}

interface CourseTimelineProps {
  courses: Course[];
  onCourseClick?: (course: Course) => void;
  className?: string;
}

export function CourseTimeline({ courses, onCourseClick, className }: CourseTimelineProps) {
  // Group courses by year and semester
  const groupedCourses = useMemo(() => {
    const groups = courses.reduce((acc, course) => {
      const key = `${course.year}-${course.semester}`;
      if (!acc[key]) {
        acc[key] = {
          year: course.year,
          semester: course.semester,
          courses: []
        };
      }
      acc[key].courses.push(course);
      return acc;
    }, {} as Record<string, { year: number; semester: string; courses: Course[] }>);

    // Sort by year and semester
    return Object.values(groups).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      // Order semesters: Spring, Summer, Fall
      const semesterOrder = { 'Spring': 0, 'Summer': 1, 'Fall': 2 };
      return (semesterOrder[b.semester as keyof typeof semesterOrder] || 3) - 
             (semesterOrder[a.semester as keyof typeof semesterOrder] || 3);
    });
  }, [courses]);

  const getSemesterColor = (semester: string) => {
    switch (semester) {
      case 'Spring': return 'bg-green-100 text-green-800';
      case 'Summer': return 'bg-yellow-100 text-yellow-800';
      case 'Fall': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={clsx('relative', className)}>
      {/* Timeline line */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300" />

      {/* Timeline groups */}
      <div className="space-y-8">
        {groupedCourses.map((group, groupIndex) => (
          <div key={`${group.year}-${group.semester}`} className="relative">
            {/* Timeline dot */}
            <div className="absolute left-8 w-4 h-4 bg-charcoal rounded-full -translate-x-1/2 mt-2" />
            
            {/* Content */}
            <div className="ml-16">
              <div className="flex items-center gap-3 mb-4">
                <SerifHeading className="text-xl">
                  {group.semester} {group.year}
                </SerifHeading>
                <span className={clsx(
                  'px-2 py-1 rounded-full text-xs font-medium',
                  getSemesterColor(group.semester)
                )}>
                  {group.courses.length} courses
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.courses.map(course => {
                  const needsTAs = course.tas.length < course.maxTAs;
                  
                  return (
                    <div
                      key={course.id}
                      onClick={() => onCourseClick?.(course)}
                      className={clsx(
                        'bg-white rounded-lg border p-4 transition-all duration-200',
                        onCourseClick && 'cursor-pointer hover:shadow-md hover:border-charcoal',
                        needsTAs ? 'border-yellow-300' : 'border-gray-200'
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-serif font-semibold text-charcoal">
                          {course.code}
                        </h4>
                        {needsTAs && (
                          <span className="text-xs text-yellow-600 font-medium">
                            Needs TAs
                          </span>
                        )}
                      </div>
                      <BodyText className="text-sm text-gray-600 mb-2">
                        {course.name}
                      </BodyText>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          {course.tas.length}/{course.maxTAs} TAs
                        </span>
                        <div className="flex -space-x-2">
                          {course.tas.slice(0, 3).map((ta, idx) => (
                            <div
                              key={ta.id}
                              className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center"
                              title={ta.name}
                            >
                              <span className="text-xs font-medium text-gray-600">
                                {ta.name.charAt(0)}
                              </span>
                            </div>
                          ))}
                          {course.tas.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-600">
                                +{course.tas.length - 3}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}