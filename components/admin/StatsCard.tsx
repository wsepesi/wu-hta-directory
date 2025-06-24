interface StatsCardProps {
  title: string;
  value: number | string;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "gray" | "indigo" | "green" | "yellow" | "red" | "purple";
}

const colorClasses = {
  gray: "text-gray-900",
  indigo: "text-indigo-600",
  green: "text-green-600",
  yellow: "text-yellow-600",
  red: "text-red-600",
  purple: "text-purple-600",
};

export default function StatsCard({
  title,
  value,
  description,
  trend,
  color = "gray",
}: StatsCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
        <dd className="mt-1 flex items-baseline">
          <span className={`text-3xl font-semibold ${colorClasses[color]}`}>
            {value}
          </span>
          {trend && (
            <span
              className={`ml-2 flex items-baseline text-sm font-semibold ${
                trend.isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </span>
          )}
        </dd>
        {description && (
          <dd className="mt-1 text-sm text-gray-500">{description}</dd>
        )}
      </div>
    </div>
  );
}