import Link from "next/link";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: Date;
}

interface InvitationNode {
  user: User;
  invitees: InvitationNode[];
}

interface InvitationTreeProps {
  node: InvitationNode;
  depth?: number;
  isLast?: boolean;
  isRoot?: boolean;
}

export default function InvitationTree({ 
  node, 
  depth = 0, 
  isLast = false,
  isRoot = true 
}: InvitationTreeProps) {
  const hasInvitees = node.invitees.length > 0;

  return (
    <div className={depth > 0 ? "ml-4" : ""}>
      <div className="flex items-center py-2">
        {depth > 0 && (
          <div className="flex items-center mr-3">
            <div className={`w-4 h-0.5 ${isLast ? "" : "bg-gray-300"}`} />
            <div className="w-0.5 h-4 bg-gray-300" />
          </div>
        )}
        
        <div className="flex-shrink-0 mr-3">
          <div
            className={`h-2 w-2 rounded-full ${
              isRoot ? "bg-indigo-600" : "bg-gray-400"
            }`}
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <Link
            href={`/profile/${node.user.id}`}
            className="text-sm font-medium text-gray-900 hover:text-indigo-600"
          >
            {node.user.firstName} {node.user.lastName}
          </Link>
          <span className="ml-2 text-xs text-gray-500">{node.user.email}</span>
          {node.user.role === "admin" && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
              Admin
            </span>
          )}
        </div>
        
        <div className="flex-shrink-0 text-xs text-gray-500">
          Joined {new Date(node.user.createdAt).toLocaleDateString()}
        </div>
      </div>

      {hasInvitees && (
        <div className={depth > 0 ? "ml-4 border-l-2 border-gray-200" : ""}>
          {node.invitees.map((invitee, index) => (
            <InvitationTree
              key={invitee.user.id}
              node={invitee}
              depth={depth + 1}
              isLast={index === node.invitees.length - 1}
              isRoot={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}