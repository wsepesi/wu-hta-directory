"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Typography } from "@/components/ui/Typography";

const PASSWORD_REQUIREMENTS = [
  { test: (pwd: string) => pwd.length >= 8, message: "At least 8 characters" },
  { test: (pwd: string) => /[A-Z]/.test(pwd), message: "One uppercase letter" },
  { test: (pwd: string) => /[a-z]/.test(pwd), message: "One lowercase letter" },
  { test: (pwd: string) => /[0-9]/.test(pwd), message: "One number" },
  { test: (pwd: string) => /[^A-Za-z0-9]/.test(pwd), message: "One special character" },
];

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState("");
  const [tokenError, setTokenError] = useState("");
  const [success, setSuccess] = useState(false);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setTokenError("Invalid reset link. Please request a new password reset.");
      setIsValidating(false);
      return;
    }

    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await fetch(`/api/auth/reset-password?token=${token}`);
      const data = await response.json();

      if (!response.ok || !data.data?.valid) {
        setTokenError(data.error || "Invalid or expired reset link.");
      }
    } catch (error) {
      setTokenError("Failed to validate reset link.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password requirements
    const failedRequirements = PASSWORD_REQUIREMENTS.filter(req => !req.test(password));
    if (failedRequirements.length > 0) {
      setError("Password must meet all requirements");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Failed to reset password");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center">
          <LoadingSpinner size="md" />
          <span className="ml-3 text-gray-600">Validating reset link...</span>
        </div>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <ErrorMessage variant="error">
              {tokenError}
            </ErrorMessage>
            <div className="mt-4 text-center">
              <Link
                href="/auth/forgot-password"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Request a new password reset
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Password reset successful
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Your password has been reset successfully. You can now sign in with your new password.
              </p>
              <Link
                href="/auth/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Go to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your new password below
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input
              label="New Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />

            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
            />

            {/* Password Requirements */}
            <div className="bg-gray-50 rounded-lg p-4">
              <Typography variant="small" className="font-medium mb-2">
                Password requirements:
              </Typography>
              <ul className="space-y-1">
                {PASSWORD_REQUIREMENTS.map((req, index) => {
                  const isMet = password && req.test(password);
                  return (
                    <li key={index} className="flex items-center text-sm">
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

            {error && (
              <ErrorMessage variant="error">
                {error}
              </ErrorMessage>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? <LoadingSpinner size="sm" className="mx-auto" /> : "Reset password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}