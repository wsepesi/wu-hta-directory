"use client";

interface DataPoint {
  label: string;
  value: number;
}

interface SimpleLineChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
  showGrid?: boolean;
  className?: string;
}

export function SimpleLineChart({ 
  data, 
  color = "#6366f1",
  height = 200,
  showGrid = true,
  className = ""
}: SimpleLineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;
  const padding = 20;
  const chartWidth = 100;
  const chartHeight = height - 2 * padding;

  // Calculate points for the line
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * chartWidth;
    const y = chartHeight - ((d.value - minValue) / range) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  // Create grid lines
  const gridLines = showGrid ? [0, 0.25, 0.5, 0.75, 1].map(i => (
    <line
      key={i}
      x1="0"
      y1={chartHeight * (1 - i)}
      x2={chartWidth}
      y2={chartHeight * (1 - i)}
      stroke="#e5e7eb"
      strokeWidth="1"
    />
  )) : null;

  return (
    <div className={className}>
      <svg
        viewBox={`-${padding} -${padding} ${chartWidth + 2 * padding} ${height}`}
        style={{ width: '100%', height }}
      >
        {/* Grid lines */}
        {gridLines}
        
        {/* Area under the line */}
        <polygon
          points={`0,${chartHeight} ${points} ${chartWidth},${chartHeight}`}
          fill={color}
          fillOpacity="0.1"
        />
        
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
        />
        
        {/* Data points */}
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * chartWidth;
          const y = chartHeight - ((d.value - minValue) / range) * chartHeight;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="3"
              fill={color}
            />
          );
        })}
      </svg>
      
      {/* Labels */}
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        {data.map((d, i) => (
          <span key={i} className="text-center" style={{ width: `${100 / data.length}%` }}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}