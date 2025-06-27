import Link from 'next/link';

export function DashboardNavigation() {
  return (
    <section>
      <h2 className="font-serif text-2xl text-charcoal mb-8">Browse</h2>
      <nav className="space-y-4">
        <Link href="/courses" className="block font-serif text-lg text-charcoal hover:opacity-70 transition-opacity duration-200">
          View All Courses →
        </Link>
        <Link href="/people" className="block font-serif text-lg text-charcoal hover:opacity-70 transition-opacity duration-200">
          View All People →
        </Link>
        <Link href="/professors" className="block font-serif text-lg text-charcoal hover:opacity-70 transition-opacity duration-200">
          View All Professors →
        </Link>
        <Link href="/semesters" className="block font-serif text-lg text-charcoal hover:opacity-70 transition-opacity duration-200">
          View by Semester →
        </Link>
      </nav>
    </section>
  );
}