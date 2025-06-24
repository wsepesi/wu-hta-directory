import { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";

export const metadata: Metadata = {
  title: "Login - WU Head TA Directory",
  description: "Login to access the Washington University Head TA Directory",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Typography variant="h1" className="text-center">
            Sign in to your account
          </Typography>
          <Typography variant="body" className="mt-2 text-center text-gray-600">
            Access the Washington University Head TA Directory
          </Typography>
        </div>
        
        <Card>
          <LoginForm />
        </Card>

        <div className="text-center">
          <Link href="/" className="text-sm text-charcoal hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}