"use client";

import { useState } from "react";
import { Button } from "../ui/Button";

interface ReportType {
  id: string;
  name: string;
  description: string;
  format: "csv" | "json" | "pdf";
}

const availableReports: ReportType[] = [
  {
    id: "user-roster",
    name: "User Roster",
    description: "Complete list of all users with their roles and contact information",
    format: "csv"
  },
  {
    id: "ta-assignments",
    name: "TA Assignments Report",
    description: "All TA assignments by semester with course and professor details",
    format: "csv"
  },
  {
    id: "course-coverage",
    name: "Course Coverage Report",
    description: "Courses with missing TAs and assignment statistics",
    format: "csv"
  },
  {
    id: "invitation-status",
    name: "Invitation Status Report",
    description: "Pending and accepted invitations with invitation tree data",
    format: "csv"
  },
  {
    id: "audit-log",
    name: "Audit Log Export",
    description: "System activity and administrative actions log",
    format: "json"
  },
  {
    id: "user-activity",
    name: "User Activity Report",
    description: "User login and activity metrics",
    format: "csv"
  }
];

export default function AdminReports() {
  const [generating, setGenerating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateReport = async (reportId: string, format: string) => {
    setGenerating(reportId);
    setError(null);

    try {
      const response = await fetch(`/api/admin/reports/${reportId}?format=${format}`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get("content-disposition");
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1].replace(/"/g, "")
        : `report-${reportId}-${new Date().toISOString().split("T")[0]}.${format}`;

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Error generating report:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(`Failed to generate report: ${errorMessage}`);
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Export Reports</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {availableReports.map((report) => (
          <div
            key={report.id}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">{report.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{report.description}</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleGenerateReport(report.id, report.format)}
                disabled={generating === report.id}
                className="ml-4"
              >
                {generating === report.id ? (
                  <>
                    <span className="inline-block w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  `Export ${report.format.toUpperCase()}`
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>Note:</strong> Reports contain sensitive information. Ensure you handle exported data according to privacy policies.
        </p>
      </div>
    </div>
  );
}