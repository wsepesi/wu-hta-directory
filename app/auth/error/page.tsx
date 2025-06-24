"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Typography } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  // Map NextAuth error codes to user-friendly messages
  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "Configuration":
        return "There is a problem with the server configuration.";
      case "AccessDenied":
        return "You do not have permission to sign in.";
      case "Verification":
        return "The verification token has expired or has already been used.";
      case "CredentialsSignin":
        return "Invalid email or password. Please check your credentials and try again.";
      case "SessionRequired":
        return "You must be signed in to access this page.";
      case "OAuthSignInError":
      case "OAuthCallbackError":
      case "OAuthCreateAccountError":
        return "There was a problem signing in with the external provider.";
      case "EmailCreateFailed":
        return "Could not send email verification.";
      case "CallbackRouteError":
        return "There was a problem with the authentication callback.";
      case "Default":
      default:
        return "An unexpected error occurred. Please try again.";
    }
  };

  const errorMessage = getErrorMessage(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Typography variant="h1" className="text-center text-red-600">
            Authentication Error
          </Typography>
          <Typography variant="body" className="mt-2 text-center text-gray-600">
            We encountered a problem signing you in
          </Typography>
        </div>
        
        <Card>
          <div className="space-y-6">
            <ErrorMessage variant="error">
              {errorMessage}
            </ErrorMessage>

            <div className="space-y-3">
              <Link href="/auth/login" className="block">
                <Button variant="primary" size="lg" className="w-full">
                  Try Again
                </Button>
              </Link>
              
              <Link href="/" className="block">
                <Button variant="secondary" size="lg" className="w-full">
                  Go to Home
                </Button>
              </Link>
            </div>

            <div className="text-center space-y-2">
              <Link href="/auth/forgot-password" className="text-sm text-charcoal hover:underline">
                Forgot your password?
              </Link>
              <div className="text-sm text-gray-600">
                Need help? Contact{" "}
                <a href="mailto:support@wustl.edu" className="text-charcoal hover:underline">
                  support@wustl.edu
                </a>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}