'use client';

import { useState, useEffect } from 'react';
import LoginForm from './LoginForm';

/**
 * Progressive enhancement wrapper for login form
 * - Works as a regular form submission without JavaScript
 * - Enhances to AJAX submission with client validation when JavaScript is available
 */
export function ProgressiveLoginForm() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Non-JS fallback: Regular form submission
  if (!isClient) {
    return (
      <form action="/api/auth/login" method="POST" className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@wustl.edu"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-charcoal/20"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-charcoal/20"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="rememberMe"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-charcoal focus:ring-charcoal"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              Remember me
            </label>
          </div>
          <a href="/auth/forgot-password" className="text-sm text-charcoal hover:underline">
            Forgot password?
          </a>
        </div>

        <button
          type="submit"
          className="w-full px-4 py-2 bg-charcoal text-white rounded-md hover:opacity-80 transition-opacity"
        >
          Sign in
        </button>

        <div className="text-sm text-center">
          <span className="text-gray-600">Don&apos;t have an account? </span>
          <a href="/auth/register" className="font-medium text-charcoal hover:underline">
            Register with invitation
          </a>
        </div>
      </form>
    );
  }

  // Enhanced version with client-side validation and AJAX
  return <LoginForm />;
}