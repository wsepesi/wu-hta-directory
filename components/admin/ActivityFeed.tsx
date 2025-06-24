interface ActivityItem {
  id: string;
  type: "user" | "invitation" | "course" | "professor" | "ta_assignment" | "system";
  description: string;
  timestamp: Date;
  metadata?: {
    userId?: string;
    userName?: string;
    courseId?: string;
    courseName?: string;
    email?: string;
    oldRole?: string;
    newRole?: string;
  };
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  maxItems?: number;
}

const activityIcons = {
  user: {
    bgColor: "bg-blue-100",
    textColor: "text-blue-700",
    icon: "U",
  },
  ta_assignment: {
    bgColor: "bg-green-100",
    textColor: "text-green-700",
    icon: "A",
  },
  invitation: {
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-700",
    icon: "I",
  },
  course: {
    bgColor: "bg-purple-100",
    textColor: "text-purple-700",
    icon: "C",
  },
  professor: {
    bgColor: "bg-pink-100",
    textColor: "text-pink-700",
    icon: "P",
  },
  system: {
    bgColor: "bg-gray-100",
    textColor: "text-gray-700",
    icon: "S",
  },
};

export default function ActivityFeed({ activities, maxItems = 10 }: ActivityFeedProps) {
  const displayActivities = activities.slice(0, maxItems);

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {displayActivities.map((activity, activityIdx) => {
          const { bgColor, textColor, icon } = activityIcons[activity.type];
          
          return (
            <li key={activity.id}>
              <div className="relative pb-8">
                {activityIdx !== displayActivities.length - 1 ? (
                  <span
                    className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex space-x-3">
                  <div>
                    <span
                      className={`h-8 w-8 rounded-full ${bgColor} flex items-center justify-center ring-8 ring-white`}
                    >
                      <span className={`text-sm font-medium leading-none ${textColor}`}>
                        {icon}
                      </span>
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <div>
                      <p className="text-sm text-gray-900">{activity.description}</p>
                    </div>
                    <div className="whitespace-nowrap text-right text-sm text-gray-500">
                      {formatTimestamp(activity.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}