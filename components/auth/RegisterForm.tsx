"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Typography } from "@/components/ui/Typography";

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  gradYear: string;
  degreeProgram: string;
  currentRole: string;
  location: string;
  linkedinUrl: string;
  personalSite: string;
}

const PASSWORD_REQUIREMENTS = [
  { test: (pwd: string) => pwd.length >= 8, message: "At least 8 characters" },
  { test: (pwd: string) => /[A-Z]/.test(pwd), message: "One uppercase letter" },
  { test: (pwd: string) => /[a-z]/.test(pwd), message: "One lowercase letter" },
  { test: (pwd: string) => /[0-9]/.test(pwd), message: "One number" },
];

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState<RegisterFormData>({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    gradYear: "",
    degreeProgram: "",
    currentRole: "",
    location: "",
    linkedinUrl: "",
    personalSite: "",
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [tokenError, setTokenError] = useState("");

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setTokenError("Invalid registration link. Please use the link from your invitation email.");
      setIsValidating(false);
      return;
    }

    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await fetch('/api/invitations/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();

      if (!response.ok) {
        setTokenError(data.error || "Invalid or expired invitation token.");
      } else if (data.data) {
        // Pre-fill email if available
        if (data.data.email) {
          setFormData((prev) => ({ ...prev, email: data.data.email }));
        }
      }
    } catch (error) {
      setTokenError("Failed to validate invitation token.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password requirements
    const failedRequirements = PASSWORD_REQUIREMENTS.filter(req => !req.test(formData.password));
    if (failedRequirements.length > 0) {
      setError("Password must meet all requirements");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          gradYear: formData.gradYear ? parseInt(formData.gradYear) : undefined,
          token,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if there are specific field errors
        if (data.details && Array.isArray(data.details)) {
          setError(`${data.error}: ${data.details.join(', ')}`);
        } else if (data.code === 'EMAIL_MISMATCH') {
          setError(data.error);
          // Clear the email field since it doesn't match
          setFormData(prev => ({ ...prev, email: '' }));
        } else if (data.code === 'USER_EXISTS') {
          setError(data.error);
        } else {
          setError(data.error || "Registration failed");
        }
        return;
      }

      // Sign in the user after successful registration
      const signInResult = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError("Registration successful but sign in failed. Please sign in manually.");
        router.push("/auth/login");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="md" />
        <span className="ml-3 text-gray-600">Validating invitation...</span>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="space-y-4">
        <ErrorMessage variant="error">
          {tokenError}
        </ErrorMessage>
        <Link href="/auth/login" className="inline-block text-sm text-charcoal hover:underline">
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Input
          label="First Name"
          name="firstName"
          type="text"
          required
          value={formData.firstName}
          onChange={handleChange}
          disabled={isLoading}
        />

        <Input
          label="Last Name"
          name="lastName"
          type="text"
          required
          value={formData.lastName}
          onChange={handleChange}
          disabled={isLoading}
        />
      </div>

      <Input
        label="Email"
        name="email"
        type="email"
        required
        value={formData.email}
        onChange={handleChange}
        placeholder="you@wustl.edu"
        disabled={isLoading}
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Input
          label="Password"
          name="password"
          type="password"
          required
          value={formData.password}
          onChange={handleChange}
          disabled={isLoading}
        />

        <Input
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          required
          value={formData.confirmPassword}
          onChange={handleChange}
          disabled={isLoading}
        />
      </div>

      {/* Password Requirements */}
      <div className="bg-gray-50 rounded-lg p-4">
        <Typography variant="small" className="font-medium mb-2">
          Password requirements:
        </Typography>
        <ul className="space-y-1">
          {PASSWORD_REQUIREMENTS.map((req, index) => {
            const isMet = formData.password && req.test(formData.password);
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

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Input
          label="Graduation Year"
          name="gradYear"
          type="number"
          value={formData.gradYear}
          onChange={handleChange}
          min="1900"
          max="2100"
          placeholder="2024"
          disabled={isLoading}
        />

        <Input
          label="Degree Program"
          name="degreeProgram"
          type="text"
          value={formData.degreeProgram}
          onChange={handleChange}
          placeholder="Computer Science"
          disabled={isLoading}
        />
      </div>

      <Input
        label="Current Role"
        name="currentRole"
        type="text"
        value={formData.currentRole}
        onChange={handleChange}
        placeholder="Software Engineer at Company"
        disabled={isLoading}
      />

      <Input
        label="Location"
        name="location"
        type="text"
        value={formData.location}
        onChange={handleChange}
        placeholder="St. Louis, MO"
        disabled={isLoading}
      />

      <Input
        label="LinkedIn URL"
        name="linkedinUrl"
        type="url"
        value={formData.linkedinUrl}
        onChange={handleChange}
        placeholder="https://linkedin.com/in/yourprofile"
        helperText="Optional - share your professional profile"
        disabled={isLoading}
      />

      <Input
        label="Personal Website"
        name="personalSite"
        type="url"
        value={formData.personalSite}
        onChange={handleChange}
        placeholder="https://yourwebsite.com"
        helperText="Optional - share your portfolio or blog"
        disabled={isLoading}
      />

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
        {isLoading ? <LoadingSpinner size="sm" className="mx-auto" /> : "Create Account"}
      </Button>

      <div className="text-sm text-center">
        <span className="text-gray-600">Already have an account? </span>
        <Link href="/auth/login" className="font-medium text-charcoal hover:underline">
          Sign in
        </Link>
      </div>
    </form>
  );
}