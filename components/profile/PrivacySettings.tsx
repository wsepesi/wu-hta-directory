"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";

interface PrivacySettingsData {
  showEmail: boolean;
  showGradYear: boolean;
  showLocation: boolean;
  showLinkedIn: boolean;
  showPersonalSite: boolean;
  showCourses: boolean;
  appearInDirectory: boolean;
  allowContact: boolean;
}

interface PrivacySettingsProps {
  userId: string;
  initialSettings: PrivacySettingsData;
}

export default function PrivacySettings({ userId, initialSettings }: PrivacySettingsProps) {
  const [settings, setSettings] = useState<PrivacySettingsData>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleToggle = (key: keyof PrivacySettingsData) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    setSuccess(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/users/${userId}/privacy`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error("Failed to update privacy settings");
      }

      setSuccess(true);
    } catch {
      setError("Failed to save privacy settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const privacyOptions = [
    {
      key: "appearInDirectory" as const,
      label: "Appear in Public Directory",
      description: "Allow your profile to be visible in the public Head TA directory",
    },
    {
      key: "showEmail" as const,
      label: "Show Email Address",
      description: "Display your email address on your public profile",
    },
    {
      key: "showGradYear" as const,
      label: "Show Graduation Year",
      description: "Display your graduation year on your public profile",
    },
    {
      key: "showLocation" as const,
      label: "Show Location",
      description: "Display your current location on your public profile",
    },
    {
      key: "showLinkedIn" as const,
      label: "Show LinkedIn Profile",
      description: "Display a link to your LinkedIn profile",
    },
    {
      key: "showPersonalSite" as const,
      label: "Show Personal Website",
      description: "Display a link to your personal website",
    },
    {
      key: "showCourses" as const,
      label: "Show Courses Taught",
      description: "Display the courses you've been a Head TA for",
    },
    {
      key: "allowContact" as const,
      label: "Allow Contact",
      description: "Allow other users to contact you through the platform",
    },
  ];

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">Privacy Settings</h2>
      
      {error && (
        <ErrorMessage variant="error" className="mb-4">
          {error}
        </ErrorMessage>
      )}
      
      {success && (
        <div className="mb-4 p-4 bg-green-50 text-green-800 rounded-md">
          Privacy settings updated successfully!
        </div>
      )}

      <div className="space-y-4">
        {privacyOptions.map(option => (
          <div key={option.key} className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id={option.key}
                type="checkbox"
                checked={settings[option.key]}
                onChange={() => handleToggle(option.key)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor={option.key} className="font-medium text-gray-700">
                {option.label}
              </label>
              <p className="text-gray-500">{option.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Privacy Settings"}
        </Button>
      </div>
    </div>
  );
}