"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Skeleton } from "@/components/ui/Skeleton";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  gradYear: number | null;
  createdAt: Date;
}

interface InvitationNode {
  user: User;
  invitees: InvitationNode[];
  stats: {
    totalDescendants: number;
    maxDepth: number;
  };
}

interface InvitationTreeNodeProps {
  node: InvitationNode;
  depth?: number;
  isLast?: boolean;
  isRoot?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}

// Skeleton component for loading state
function InvitationTreeSkeleton() {
  return (
    <div className="bg-white shadow rounded-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <Skeleton variant="text" width="140px" height="24px" />
          <div className="flex items-center space-x-4">
            <Skeleton variant="rectangular" width="200px" height="32px" className="rounded-md" />
            <Skeleton variant="text" width="80px" height="20px" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center">
              <Skeleton variant="text" width="100px" height="16px" className="mr-2" />
              <Skeleton variant="text" width="40px" height="16px" />
            </div>
          ))}
        </div>
      </div>

      {/* Tree structure */}
      <div className="p-6">
        <div className="space-y-4">
          {/* Root nodes */}
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="flex items-center py-2">
                <Skeleton variant="rectangular" width={16} height={16} className="mr-2 rounded" />
                <Skeleton variant="circular" width={12} height={12} className="mr-3" />
                <Skeleton variant="text" width="200px" height="16px" className="mr-2" />
                <Skeleton variant="text" width="120px" height="14px" />
              </div>
              {/* Child nodes */}
              <div className="ml-6 space-y-2">
                {[1, 2].map((j) => (
                  <div key={j} className="flex items-center py-2">
                    <div className="flex items-center mr-3">
                      <Skeleton variant="rectangular" width={16} height={2} />
                      <Skeleton variant="rectangular" width={2} height={24} />
                    </div>
                    <Skeleton variant="circular" width={12} height={12} className="mr-3" />
                    <Skeleton variant="text" width="180px" height="16px" className="mr-2" />
                    <Skeleton variant="text" width="100px" height="14px" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InvitationTreeNode({ 
  node, 
  depth = 0, 
  isLast = false,
  isRoot = true,
  expanded = true,
  onToggle
}: InvitationTreeNodeProps) {
  const hasInvitees = node.invitees.length > 0;
  const [isExpanded, setIsExpanded] = useState(expanded);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    onToggle?.();
  };

  return (
    <div className={depth > 0 ? "ml-6" : ""}>
      <div className="flex items-center py-2 group">
        {depth > 0 && (
          <div className="flex items-center mr-3">
            <div className={`w-4 h-0.5 ${isLast ? "" : "bg-gray-300"}`} />
            <div className="w-0.5 h-6 bg-gray-300" />
          </div>
        )}
        
        {hasInvitees && (
          <button
            onClick={handleToggle}
            className="flex-shrink-0 mr-2 p-1 rounded hover:bg-gray-100"
          >
            <svg
              className={`h-4 w-4 text-gray-500 transform transition-transform ${
                isExpanded ? "rotate-90" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}
        
        <div className="flex-shrink-0 mr-3">
          <div
            className={`h-3 w-3 rounded-full border-2 ${
              isRoot 
                ? "bg-indigo-600 border-indigo-600" 
                : node.user.role === "admin"
                ? "bg-purple-500 border-purple-500"
                : "bg-green-500 border-green-500"
            }`}
          />
        </div>
        
        <div className="flex-1 min-w-0 flex items-center">
          <Link
            href={`/profile/${node.user.id}`}
            className="text-sm font-medium text-gray-900 hover:text-indigo-600 truncate"
          >
            {node.user.firstName} {node.user.lastName}
          </Link>
          <span className="ml-2 text-xs text-gray-500 truncate">{node.user.email}</span>
          {node.user.role === "admin" && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
              Admin
            </span>
          )}
          {node.user.gradYear && (
            <span className="ml-2 text-xs text-gray-400">
              Class of {node.user.gradYear}
            </span>
          )}
        </div>
        
        <div className="flex-shrink-0 flex items-center space-x-4 text-xs text-gray-500">
          {hasInvitees && (
            <span className="bg-gray-100 px-2 py-1 rounded">
              {node.invitees.length} direct • {node.stats.totalDescendants} total
            </span>
          )}
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">
            {new Date(node.user.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {hasInvitees && isExpanded && (
        <div className={depth >= 0 ? "ml-3 border-l-2 border-gray-200" : ""}>
          {node.invitees.map((invitee, index) => (
            <InvitationTreeNode
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

export default function EnhancedInvitationTree() {
  const [treeData, setTreeData] = useState<InvitationNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showStats, setShowStats] = useState(true);

  useEffect(() => {
    fetchTreeData();
  }, []);

  const fetchTreeData = async () => {
    try {
      const response = await fetch("/api/admin/invitation-tree");
      if (!response.ok) throw new Error("Failed to fetch invitation tree");
      
      const data = await response.json();
      setTreeData(data.trees);
      setError(null);
    } catch (err) {
      console.error("Error fetching invitation tree:", err);
      setError("Failed to load invitation tree");
    } finally {
      setLoading(false);
    }
  };

  const filterTree = (node: InvitationNode, query: string): InvitationNode | null => {
    const userMatches = 
      `${node.user.firstName} ${node.user.lastName}`.toLowerCase().includes(query.toLowerCase()) ||
      node.user.email.toLowerCase().includes(query.toLowerCase());

    const filteredInvitees = node.invitees
      .map(invitee => filterTree(invitee, query))
      .filter(Boolean) as InvitationNode[];

    if (userMatches || filteredInvitees.length > 0) {
      return {
        ...node,
        invitees: filteredInvitees
      };
    }

    return null;
  };

  const filteredTrees = searchQuery
    ? treeData.map(tree => filterTree(tree, searchQuery)).filter(Boolean) as InvitationNode[]
    : treeData;

  if (loading) {
    return <InvitationTreeSkeleton />;
  }

  if (error) {
    return <ErrorMessage variant="error">{error}</ErrorMessage>;
  }

  const totalUsers = treeData.reduce((sum, tree) => sum + tree.stats.totalDescendants + 1, 0);
  const maxDepth = Math.max(...treeData.map(tree => tree.stats.maxDepth));

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Invitation Tree</h2>
          <div className="flex items-center space-x-4">
            <input
              type="search"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={() => setShowStats(!showStats)}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              {showStats ? "Hide" : "Show"} Stats
            </button>
          </div>
        </div>
      </div>

      {showStats && (
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Total Users:</span>
              <span className="ml-2 font-medium">{totalUsers}</span>
            </div>
            <div>
              <span className="text-gray-500">Root Nodes:</span>
              <span className="ml-2 font-medium">{treeData.length}</span>
            </div>
            <div>
              <span className="text-gray-500">Max Depth:</span>
              <span className="ml-2 font-medium">{maxDepth} levels</span>
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        {filteredTrees.length > 0 ? (
          <div className="space-y-4">
            {filteredTrees.map((tree) => (
              <InvitationTreeNode
                key={tree.user.id}
                node={tree}
                isRoot={true}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">
            {searchQuery ? "No users found matching your search." : "No invitation data available."}
          </p>
        )}
      </div>

      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-indigo-600 mr-1" />
              <span>Root User</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-purple-500 mr-1" />
              <span>Admin</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-green-500 mr-1" />
              <span>Head TA</span>
            </div>
          </div>
          <button
            onClick={fetchTreeData}
            className="text-indigo-600 hover:text-indigo-500"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}