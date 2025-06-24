import { Metadata } from "next";
import RegisterForm from "@/components/auth/RegisterForm";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";

export const metadata: Metadata = {
  title: "Register - WU Head TA Directory",
  description: "Create your account in the Washington University Head TA Directory",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div>
          <Typography variant="h1" className="text-center">
            Create your account
          </Typography>
          <Typography variant="body" className="mt-2 text-center text-gray-600">
            Join the Washington University Head TA Directory with your invitation token
          </Typography>
        </div>
        
        <Card>
          <RegisterForm />
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