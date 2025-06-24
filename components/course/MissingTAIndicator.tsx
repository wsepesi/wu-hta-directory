import { clsx } from 'clsx';

interface MissingTAIndicatorProps {
  currentTAs: number;
  requiredTAs: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function MissingTAIndicator({
  currentTAs,
  requiredTAs,
  size = 'md',
  showLabel = true,
  className
}: MissingTAIndicatorProps) {
  const missingTAs = requiredTAs - currentTAs;
  const percentageFilled = (currentTAs / requiredTAs) * 100;
  
  // Determine severity
  const severity = missingTAs === 0 ? 'complete' : 
                  missingTAs === 1 ? 'warning' : 
                  'critical';

  const sizeStyles = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const severityColors = {
    complete: 'bg-green-500',
    warning: 'bg-yellow-500',
    critical: 'bg-red-500'
  };

  const severityTextColors = {
    complete: 'text-green-700',
    warning: 'text-yellow-700',
    critical: 'text-red-700'
  };

  return (
    <div className={clsx('space-y-1', className)}>
      {showLabel && (
        <div className="flex justify-between items-center">
          <span className={clsx(
            'text-xs font-medium',
            severityTextColors[severity]
          )}>
            {missingTAs === 0 
              ? 'Fully staffed' 
              : `${missingTAs} TA${missingTAs > 1 ? 's' : ''} needed`}
          </span>
          <span className="text-xs text-gray-500">
            {currentTAs}/{requiredTAs}
          </span>
        </div>
      )}
      
      <div className="relative">
        <div className={clsx(
          'w-full bg-gray-200 rounded-full overflow-hidden',
          sizeStyles[size]
        )}>
          <div
            className={clsx(
              'h-full transition-all duration-300',
              severityColors[severity]
            )}
            style={{ width: `${percentageFilled}%` }}
          />
        </div>
        
        {/* Visual indicators for missing slots */}
        {missingTAs > 0 && size !== 'sm' && (
          <div className="absolute inset-0 flex justify-end pr-1">
            {Array.from({ length: Math.min(missingTAs, 3) }).map((_, idx) => (
              <div
                key={idx}
                className={clsx(
                  'w-1 h-full bg-white rounded-full mr-1',
                  size === 'lg' ? 'w-1.5' : 'w-1'
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}