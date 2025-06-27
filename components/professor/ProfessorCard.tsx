import Image from 'next/image';
import { Card, CardHeader, CardBody, CardFooter } from '../ui/Card';
import { SerifHeading, BodyText } from '../ui/Typography';
import { Button } from '../ui/Button';
import { MissingTAIndicator } from '../course/MissingTAIndicator';

interface Course {
  id: string;
  code: string;
  name: string;
  semester: string;
  currentTAs: number;
  requiredTAs: number;
}

interface ProfessorCardProps {
  professor: {
    id: string;
    name: string;
    email: string;
    department?: string;
    office?: string;
    phone?: string;
    imageUrl?: string;
    bio?: string;
    courses: Course[];
  };
  onContact?: () => void;
  onViewCourses?: () => void;
  showActions?: boolean;
  className?: string;
}

export function ProfessorCard({ 
  professor, 
  onContact,
  onViewCourses,
  showActions = true,
  className 
}: ProfessorCardProps) {
  const coursesNeedingTAs = professor.courses.filter(
    course => course.currentTAs < course.requiredTAs
  ).length;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start gap-4">
          {professor.imageUrl ? (
            <Image
              src={professor.imageUrl}
              alt={professor.name}
              width={80}
              height={80}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-2xl font-semibold text-gray-500">
                {professor.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
          )}
          <div className="flex-1">
            <SerifHeading className="text-xl mb-1">{professor.name}</SerifHeading>
            {professor.department && (
              <BodyText className="text-sm text-gray-600 mb-2">
                {professor.department}
              </BodyText>
            )}
            <div className="space-y-1 text-sm text-gray-600">
              {professor.office && (
                <div>Office: {professor.office}</div>
              )}
              {professor.phone && (
                <div>Phone: {professor.phone}</div>
              )}
              <div>Email: {professor.email}</div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardBody>
        {professor.bio && (
          <BodyText className="text-sm mb-4 text-gray-700">
            {professor.bio}
          </BodyText>
        )}

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-sm text-charcoal">Current Courses</h4>
            {coursesNeedingTAs > 0 && (
              <span className="text-xs text-yellow-600 font-medium">
                {coursesNeedingTAs} need{coursesNeedingTAs === 1 ? 's' : ''} TAs
              </span>
            )}
          </div>

          {professor.courses.length > 0 ? (
            <div className="space-y-2">
              {professor.courses.slice(0, 3).map((course) => (
                <div key={course.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-medium text-sm">{course.code}</span>
                      <BodyText className="text-xs text-gray-600">
                        {course.name}
                      </BodyText>
                    </div>
                    <span className="text-xs text-gray-500">
                      {course.semester}
                    </span>
                  </div>
                  <MissingTAIndicator
                    currentTAs={course.currentTAs}
                    requiredTAs={course.requiredTAs}
                    size="sm"
                    showLabel={false}
                  />
                </div>
              ))}
              {professor.courses.length > 3 && (
                <BodyText className="text-xs text-gray-500 text-center">
                  +{professor.courses.length - 3} more courses
                </BodyText>
              )}
            </div>
          ) : (
            <BodyText className="text-sm text-gray-500">
              No current courses
            </BodyText>
          )}
        </div>
      </CardBody>

      {showActions && (onContact || onViewCourses) && (
        <CardFooter>
          <div className="flex gap-2">
            {onViewCourses && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onViewCourses}
                className="flex-1"
              >
                View All Courses
              </Button>
            )}
            {onContact && (
              <Button
                variant="primary"
                size="sm"
                onClick={onContact}
                className="flex-1"
              >
                Contact
              </Button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}