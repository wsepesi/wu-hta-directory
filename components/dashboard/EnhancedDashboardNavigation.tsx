'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Navigation links with prefetch configuration
const navigationLinks = [
  { href: '/courses', label: 'View All Courses', priority: 'high' },
  { href: '/people', label: 'View All People', priority: 'high' },
  { href: '/professors', label: 'View All Professors', priority: 'medium' },
  { href: '/semesters', label: 'View by Semester', priority: 'medium' },
];

export function EnhancedDashboardNavigation() {
  const router = useRouter();
  
  useEffect(() => {
    // Prefetch high priority links immediately
    navigationLinks
      .filter(link => link.priority === 'high')
      .forEach(link => {
        router.prefetch(link.href);
      });
    
    // Prefetch medium priority links after a delay
    const timer = setTimeout(() => {
      navigationLinks
        .filter(link => link.priority === 'medium')
        .forEach(link => {
          router.prefetch(link.href);
        });
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [router]);
  
  return (
    <section>
      <h2 className="font-serif text-2xl text-charcoal mb-8">Browse</h2>
      <nav className="space-y-4">
        {navigationLinks.map((link) => (
          <Link 
            key={link.href}
            href={link.href} 
            className="block font-serif text-lg text-charcoal hover:opacity-70 transition-opacity duration-200"
            prefetch={true}
          >
            {link.label} →
          </Link>
        ))}
      </nav>
    </section>
  );
}