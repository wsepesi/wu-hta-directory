import { clsx } from 'clsx';
import { Skeleton } from './Skeleton';

interface FormSkeletonProps {
  className?: string;
  fields?: number;
  showButtons?: boolean;
  buttonCount?: number;
}

export function FormSkeleton({ 
  className,
  fields = 3,
  showButtons = true,
  buttonCount = 2
}: FormSkeletonProps) {
  return (
    <div className={clsx('space-y-6', className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <Skeleton variant="text" className="h-5 w-24 mb-2" />
          <Skeleton variant="rectangular" height={40} className="w-full" />
        </div>
      ))}
      
      {showButtons && (
        <div className="flex justify-end space-x-3 pt-4">
          {Array.from({ length: buttonCount }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={40} className="w-24" />
          ))}
        </div>
      )}
    </div>
  );
}

// Modal-specific form skeleton
export function ModalFormSkeleton({ 
  title = true,
  className 
}: { 
  title?: boolean;
  className?: string 
}) {
  return (
    <div className={clsx('bg-white rounded-lg shadow-xl', className)}>
      {title && (
        <div className="px-6 py-4 border-b border-gray-200">
          <Skeleton variant="text" className="h-6 w-48 mb-2" />
          <Skeleton variant="text" className="h-4 w-64" />
        </div>
      )}
      
      <div className="px-6 py-4">
        <FormSkeleton fields={3} showButtons={false} />
      </div>
      
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-end space-x-3">
          <Skeleton variant="rectangular" height={40} className="w-20" />
          <Skeleton variant="rectangular" height={40} className="w-24" />
        </div>
      </div>
    </div>
  );
}

// Search form skeleton (for forms with search functionality)
export function SearchFormSkeleton({ className }: { className?: string }) {
  return (
    <div className={clsx('space-y-6', className)}>
      {/* Search field */}
      <div>
        <Skeleton variant="text" className="h-5 w-32 mb-2" />
        <Skeleton variant="rectangular" height={40} className="w-full" />
      </div>
      
      {/* Results/suggestions area */}
      <div>
        <Skeleton variant="text" className="h-5 w-24 mb-3" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Skeleton variant="text" className="h-5 w-32 mb-2" />
                  <Skeleton variant="text" className="h-4 w-48" />
                </div>
                <Skeleton variant="text" className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Input field */}
      <div>
        <Skeleton variant="text" className="h-5 w-28 mb-2" />
        <Skeleton variant="rectangular" height={40} className="w-32" />
      </div>
    </div>
  );
}

// Inline form skeleton (for simple forms)
export function InlineFormSkeleton({ 
  className,
  showLabel = true 
}: { 
  className?: string;
  showLabel?: boolean;
}) {
  return (
    <div className={clsx('flex items-end space-x-3', className)}>
      <div className="flex-1">
        {showLabel && <Skeleton variant="text" className="h-5 w-24 mb-2" />}
        <Skeleton variant="rectangular" height={40} className="w-full" />
      </div>
      <Skeleton variant="rectangular" height={40} className="w-24" />
    </div>
  );
}

// Complex form with sections
export function SectionedFormSkeleton({ 
  sections = 2,
  fieldsPerSection = 2,
  className 
}: { 
  sections?: number;
  fieldsPerSection?: number;
  className?: string;
}) {
  return (
    <div className={clsx('space-y-8', className)}>
      {Array.from({ length: sections }).map((_, sectionIndex) => (
        <div key={sectionIndex}>
          <Skeleton variant="text" className="h-6 w-32 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: fieldsPerSection }).map((_, fieldIndex) => (
              <div key={fieldIndex}>
                <Skeleton variant="text" className="h-5 w-24 mb-2" />
                <Skeleton variant="rectangular" height={40} className="w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
      
      <div className="flex justify-end space-x-3 pt-4">
        <Skeleton variant="rectangular" height={40} className="w-20" />
        <Skeleton variant="rectangular" height={40} className="w-32" />
      </div>
    </div>
  );
}