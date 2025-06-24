import { Card, CardHeader, CardBody, CardFooter } from '../ui/Card';
import { SerifHeading, BodyText } from '../ui/Typography';
import { Button } from '../ui/Button';
import { clsx } from 'clsx';

interface Professor {
  id: string;
  name: string;
  email: string;
}

interface TA {
  id: string;
  name: string;
  email: string;
}

interface CourseCardProps {
  course: {
    id: string;
    code: string;
    name: string;
    description?: string;
    credits: number;
    professor: Professor;
    tas: TA[];
    maxTAs: number;
    semester: string;
    schedule?: string;
    enrollment?: {
      current: number;
      max: number;
    };
  };
  onViewDetails?: () => void;
  onEditCourse?: () => void;
  onManageTAs?: () => void;
  showActions?: boolean;
  className?: string;
}

export function CourseCard({ 
  course, 
  onViewDetails,
  onEditCourse,
  onManageTAs,
  showActions = false,
  className 
}: CourseCardProps) {
  const needsTAs = course.tas.length < course.maxTAs;
  const taSlotsFilled = course.tas.length;
  const taSlotsTotal = course.maxTAs;

  return (
    <Card hoverable={!!onViewDetails} onClick={onViewDetails} className={className}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <SerifHeading className="text-xl">{course.code}</SerifHeading>
              <span className="text-sm text-gray-500">({course.credits} credits)</span>
            </div>
            <BodyText className="text-lg font-medium">{course.name}</BodyText>
          </div>
          {needsTAs && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Needs TAs
            </span>
          )}
        </div>
      </CardHeader>

      <CardBody>
        {course.description && (
          <BodyText className="text-sm text-gray-600 mb-4 line-clamp-2">
            {course.description}
          </BodyText>
        )}

        <div className="space-y-3">
          <div>
            <span className="text-sm font-semibold text-charcoal">Professor: </span>
            <span className="text-sm text-gray-600">{course.professor.name}</span>
          </div>

          <div>
            <span className="text-sm font-semibold text-charcoal">Semester: </span>
            <span className="text-sm text-gray-600">{course.semester}</span>
          </div>

          {course.schedule && (
            <div>
              <span className="text-sm font-semibold text-charcoal">Schedule: </span>
              <span className="text-sm text-gray-600">{course.schedule}</span>
            </div>
          )}

          {course.enrollment && (
            <div>
              <span className="text-sm font-semibold text-charcoal">Enrollment: </span>
              <span className="text-sm text-gray-600">
                {course.enrollment.current}/{course.enrollment.max} students
              </span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-charcoal">TAs: </span>
              <span className={clsx(
                "text-sm",
                needsTAs ? "text-yellow-600 font-medium" : "text-gray-600"
              )}>
                {taSlotsFilled}/{taSlotsTotal} slots filled
              </span>
            </div>
            {course.tas.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {course.tas.map((ta) => (
                  <span
                    key={ta.id}
                    className="inline-block px-2 py-1 bg-gray-100 rounded-md text-xs font-medium text-charcoal"
                  >
                    {ta.name}
                  </span>
                ))}
              </div>
            ) : (
              <BodyText className="text-sm text-gray-500">
                No TAs assigned yet
              </BodyText>
            )}
          </div>
        </div>
      </CardBody>

      {showActions && (onEditCourse || onManageTAs) && (
        <CardFooter>
          <div className="flex gap-2">
            {onEditCourse && (
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditCourse();
                }}
                className="flex-1"
              >
                Edit Course
              </Button>
            )}
            {onManageTAs && (
              <Button
                variant="primary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onManageTAs();
                }}
                className="flex-1"
              >
                Manage TAs
              </Button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}