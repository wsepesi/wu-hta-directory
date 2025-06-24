import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Page not found
          </h2>
          <p className="text-gray-600 mb-8">
            Sorry, we couldn't find the page you're looking for. 
            It may have been moved or doesn't exist.
          </p>
        </div>

        <div className="space-y-4">
          <Link href="/" className="block">
            <Button variant="primary" size="lg" className="w-full">
              Go to homepage
            </Button>
          </Link>
          
          <Link href="/directory" className="block">
            <Button variant="secondary" size="lg" className="w-full">
              Browse directory
            </Button>
          </Link>
        </div>

        <div className="pt-8">
          <p className="text-sm text-gray-500">
            If you believe this is an error, please{' '}
            <Link href="/auth/login" className="text-charcoal hover:underline">
              sign in
            </Link>{' '}
            or contact support.
          </p>
        </div>
      </div>
    </div>
  );
}