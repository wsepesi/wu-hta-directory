import Image from 'next/image';
import { Card, CardHeader, CardBody, CardFooter } from '../ui/Card';
import { SerifHeading, BodyText } from '../ui/Typography';
import { Button } from '../ui/Button';

interface Course {
  id: string;
  name: string;
  code: string;
  semester: string;
}

interface TACardProps {
  ta: {
    id: string;
    name: string;
    email: string;
    major?: string;
    year?: string;
    courses: Course[];
    imageUrl?: string;
    bio?: string;
    availability?: string;
  };
  onContact?: () => void;
  onViewDetails?: () => void;
  className?: string;
}

export function TACard({ ta, onContact, onViewDetails, className }: TACardProps) {
  return (
    <Card hoverable className={className}>
      <CardHeader>
        <div className="flex items-start gap-4">
          {ta.imageUrl ? (
            <Image
              src={ta.imageUrl}
              alt={ta.name}
              width={64}
              height={64}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-2xl font-semibold text-gray-500">
                {ta.name.charAt(0)}
              </span>
            </div>
          )}
          <div className="flex-1">
            <SerifHeading className="text-xl mb-1">{ta.name}</SerifHeading>
            <BodyText className="text-sm text-gray-600">
              {ta.major && `${ta.major} • `}
              {ta.year && `Class of ${ta.year}`}
            </BodyText>
          </div>
        </div>
      </CardHeader>

      <CardBody>
        {ta.bio && (
          <BodyText className="text-sm mb-4 line-clamp-2">
            {ta.bio}
          </BodyText>
        )}
        
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-charcoal">Current Courses</h4>
          {ta.courses.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {ta.courses.map((course) => (
                <span
                  key={course.id}
                  className="inline-block px-2 py-1 bg-gray-100 rounded-md text-xs font-medium text-charcoal"
                >
                  {course.code}
                </span>
              ))}
            </div>
          ) : (
            <BodyText className="text-sm text-gray-500">
              No current courses
            </BodyText>
          )}
        </div>

        {ta.availability && (
          <div className="mt-3">
            <h4 className="font-semibold text-sm text-charcoal mb-1">Availability</h4>
            <BodyText className="text-sm text-gray-600">
              {ta.availability}
            </BodyText>
          </div>
        )}
      </CardBody>

      <CardFooter>
        <div className="flex gap-2">
          {onViewDetails && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onViewDetails}
              className="flex-1"
            >
              View Details
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
    </Card>
  );
}