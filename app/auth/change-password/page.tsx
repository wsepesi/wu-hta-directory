"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { showToast } from "@/components/ui/Toast";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";

export default function ChangePasswordPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState("");

  // Password requirements
  const PASSWORD_REQUIREMENTS = [
    { test: (pwd: string) => pwd.length >= 8, message: "At least 8 characters" },
    { test: (pwd: string) => /[A-Z]/.test(pwd), message: "One uppercase letter" },
    { test: (pwd: string) => /[a-z]/.test(pwd), message: "One lowercase letter" },
    { test: (pwd: string) => /[0-9]/.test(pwd), message: "One number" },
    { test: (pwd: string) => /[^A-Za-z0-9]/.test(pwd), message: "One special character" },
  ];

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (!session) {
    router.push("/auth/login");
    return null;
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    setGeneralError("");

    if (!formData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else {
      // Check password requirements
      const failedRequirements = PASSWORD_REQUIREMENTS.filter(req => !req.test(formData.newPassword));
      if (failedRequirements.length > 0) {
        newErrors.newPassword = "Password must meet all requirements";
      } else if (formData.newPassword === formData.currentPassword) {
        newErrors.newPassword = "New password must be different from current password";
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast("Password changed successfully!", "success");
        router.push("/profile");
      } else {
        if (data.error?.toLowerCase().includes("incorrect")) {
          setErrors({
            currentPassword: data.error,
          });
        } else {
          setGeneralError(data.error || "Failed to change password");
        }
      }
    } catch (error) {
      console.error("Failed to change password:", error);
      setGeneralError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Change Password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your current password and choose a new one
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {generalError && (
            <ErrorMessage variant="error" className="mb-6">
              {generalError}
            </ErrorMessage>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Current Password
              </label>
              <div className="mt-1">
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.currentPassword}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                    errors.currentPassword
                      ? "border-red-300"
                      : "border-gray-300"
                  }`}
                />
                {errors.currentPassword && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.currentPassword}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700"
              >
                New Password
              </label>
              <div className="mt-1">
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.newPassword}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                    errors.newPassword ? "border-red-300" : "border-gray-300"
                  }`}
                />
                {errors.newPassword && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.newPassword}
                  </p>
                )}
              </div>
              
              {/* Password Requirements */}
              {formData.newPassword && (
                <div className="mt-3 bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-700 mb-2">Password requirements:</p>
                  <ul className="space-y-1">
                    {PASSWORD_REQUIREMENTS.map((req, index) => {
                      const isMet = req.test(formData.newPassword);
                      return (
                        <li key={index} className="flex items-center text-xs">
                          <span className={`mr-2 ${isMet ? 'text-green-600' : 'text-gray-400'}`}>
                            {isMet ? '✓' : '○'}
                          </span>
                          <span className={isMet ? 'text-green-600' : 'text-gray-600'}>
                            {req.message}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm New Password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                    errors.confirmPassword
                      ? "border-red-300"
                      : "border-gray-300"
                  }`}
                />
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Link
                href="/profile"
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <LoadingSpinner size="sm" className="mx-auto" />
                ) : (
                  "Change Password"
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}