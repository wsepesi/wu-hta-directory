import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-8 py-16">
        <main className="text-center">
          
          {/* Subtitle and description */}
          <div className="font-serif text-charcoal mb-16 space-y-6">
            <p className="text-xl leading-relaxed">
              <em>Washington University Computer Science Head TA Directory</em>
            </p>
            <p className="text-lg leading-relaxed max-w-2xl mx-auto">
              {/* TEXT TEXT TEXT */}
            </p>
          </div>

          {/* Navigation links */}
          <nav className="font-serif space-y-4 sm:space-y-0 sm:space-x-12 sm:flex sm:justify-center">
            <Link 
              href="/directory" 
              prefetch={false}
              className="block sm:inline text-sm uppercase tracking-wider text-charcoal hover:opacity-70 transition-opacity duration-200"
            >
              Browse Directory
            </Link>
            <Link 
              href="/courses" 
              prefetch={false}
              className="block sm:inline text-sm uppercase tracking-wider text-charcoal hover:opacity-70 transition-opacity duration-200"
            >
              Courses
            </Link>
            <Link 
              href="/professors" 
              prefetch={false}
              className="block sm:inline text-sm uppercase tracking-wider text-charcoal hover:opacity-70 transition-opacity duration-200"
            >
              Faculty
            </Link>
            <Link 
              href="/auth/signin" 
              prefetch={false}
              className="block sm:inline text-sm uppercase tracking-wider text-charcoal hover:opacity-70 transition-opacity duration-200"
            >
              Sign In
            </Link>
          </nav>
        </main>
      </div>
    </div>
  );
}
