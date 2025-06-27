"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { useFormValidation } from "@/hooks/useFormValidation";
import { isValidEmail } from "@/lib/validation";
import { ProgressiveForm } from "./ProgressiveForm";

// Login form schema
const loginSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .refine(isValidEmail, 'Please enter a valid email address'),
  password: z.string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Check for server-side errors/success from progressive enhancement
  useEffect(() => {
    const serverError = searchParams.get('error');
    const serverSuccess = searchParams.get('success');
    const email = searchParams.get('email');
    
    if (serverError) {
      switch (serverError) {
        case 'rate_limit':
          setError('Too many login attempts. Please try again later.');
          break;
        case 'missing_fields':
          setError('Please enter both email and password.');
          break;
        case 'invalid_credentials':
          setError('Invalid email or password');
          break;
        case 'server_error':
          setError('An error occurred. Please try again.');
          break;
        default:
          setError(serverError);
      }
    }
    
    if (serverSuccess === 'account_created' && email) {
      setError(''); // Clear any errors
      // Pre-fill email for convenience
      const emailField = document.querySelector('input[name="email"]') as HTMLInputElement;
      if (emailField) {
        emailField.value = email;
      }
    }
  }, [searchParams]);
  
  const {
    register,
    handleSubmit,
    values,
    isValid,
  } = useFormValidation<LoginFormData>({
    schema: loginSchema,
    mode: 'onBlur',
    revalidateMode: 'onChange',
  });

  const onSubmit = async (data: LoginFormData) => {
    setError("");
    setIsLoading(true);

    try {
      // First check rate limiting
      const rateLimitResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (rateLimitResponse.status === 429) {
        const responseData = await rateLimitResponse.json();
        setError(responseData.error || "Too many login attempts. Please try again later.");
        return;
      }

      // Proceed with actual login
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe?.toString() || "false",
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const emailField = register('email');
  const passwordField = register('password');
  const rememberMeField = register('rememberMe');

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  return (
    <ProgressiveForm
      action="/api/auth/signin-action"
      method="POST"
      enhancedOnSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
    >
      {/* Hidden field for callback URL */}
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      
      <div>
        <Input
          label="Email"
          type="email"
          {...emailField}
          placeholder="you@wustl.edu"
          disabled={isLoading}
          error={emailField.touched && emailField.error ? emailField.error.message : undefined}
          required
          pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
          title="Please enter a valid email address"
        />
      </div>

      <div>
        <Input
          label="Password"
          type="password"
          {...passwordField}
          disabled={isLoading}
          error={passwordField.touched && passwordField.error ? passwordField.error.message : undefined}
          required
          minLength={8}
          title="Password must be at least 8 characters"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="remember-me"
            name="rememberMe"
            type="checkbox"
            checked={values.rememberMe || false}
            onChange={rememberMeField.onChange}
            onBlur={rememberMeField.onBlur}
            className="h-4 w-4 rounded border-gray-300 text-charcoal focus:ring-charcoal"
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
            Remember me
          </label>
        </div>
        <Link href="/auth/forgot-password" className="text-sm text-charcoal hover:underline">
          Forgot password?
        </Link>
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
        disabled={isLoading || !isValid}
        className="w-full"
      >
        {isLoading ? "Signing in..." : "Sign in"}
      </Button>

      <div className="text-sm text-center">
        <span className="text-gray-600">Don&apos;t have an account? </span>
        <Link href="/auth/register" className="font-medium text-charcoal hover:underline">
          Register with invitation
        </Link>
      </div>
    </ProgressiveForm>
  );
}