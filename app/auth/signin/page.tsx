"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ProgressiveForm } from "@/components/auth/ProgressiveForm";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  
  // Handle server-side errors/success from progressive enhancement
  useEffect(() => {
    const serverError = searchParams.get('error');
    const serverSuccess = searchParams.get('success');
    const serverEmail = searchParams.get('email');
    
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
    
    if (serverSuccess === 'account_created' && serverEmail) {
      setEmail(serverEmail);
      setError(null);
    }
    
    if (serverSuccess === 'password_reset' && serverEmail) {
      setEmail(serverEmail);
      setError(null);
      // You could also show a success message here if desired
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else if (result?.ok) {
        window.location.href = callbackUrl;
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-8 py-16">
        <div className="max-w-sm mx-auto">
          <h1 className="font-serif text-2xl text-charcoal text-center mb-12">
            Sign In
          </h1>
          
          <ProgressiveForm 
            className="space-y-8" 
            action="/api/auth/signin-action"
            method="POST"
            enhancedOnSubmit={handleSubmit}
          >
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            <div className="space-y-6">
              <div>
                <label htmlFor="email" className="block font-serif text-sm uppercase tracking-wider text-charcoal mb-2">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                  title="Please enter a valid email address"
                  className="w-full px-0 py-2 font-serif text-charcoal bg-transparent border-0 border-b border-charcoal/20 focus:border-charcoal focus:ring-0 focus:outline-none transition-colors duration-200"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block font-serif text-sm uppercase tracking-wider text-charcoal mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  minLength={8}
                  title="Password must be at least 8 characters"
                  className="w-full px-0 py-2 font-serif text-charcoal bg-transparent border-0 border-b border-charcoal/20 focus:border-charcoal focus:ring-0 focus:outline-none transition-colors duration-200"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <p className="font-serif text-sm text-red-600 text-center">
                {error}
              </p>
            )}

            <div className="space-y-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full font-serif text-sm uppercase tracking-wider py-3 px-6 bg-charcoal text-white hover:opacity-80 transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
              
              <div className="text-center space-y-2">
                <Link 
                  href="/auth/forgot-password" 
                  className="block font-serif text-sm text-charcoal hover:opacity-70 transition-opacity duration-200"
                >
                  Forgot your password?
                </Link>
                <Link 
                  href="/" 
                  className="block font-serif text-sm text-charcoal hover:opacity-70 transition-opacity duration-200"
                >
                  Back to home
                </Link>
              </div>
            </div>
          </ProgressiveForm>
        </div>
      </div>
    </div>
  );
}