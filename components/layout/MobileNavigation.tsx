'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '../ui/Button';
import { ScriptHeading } from '../ui/Typography';
import { clsx } from 'clsx';

interface MobileNavigationProps {
  isAuthenticated?: boolean;
  userRole?: 'ta' | 'professor' | 'admin';
  className?: string;
}

export function MobileNavigation({ 
  isAuthenticated = false, 
  userRole,
  className 
}: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const navItems = [
    { href: '/directory', label: 'Directory', public: true },
    { href: '/courses', label: 'Courses', public: false },
    { href: '/tas', label: 'TAs', public: false, roles: ['admin', 'professor'] },
    { href: '/professors', label: 'Professors', public: false, roles: ['admin'] },
    { href: '/admin', label: 'Admin', public: false, roles: ['admin'] },
  ];

  const visibleItems = navItems.filter(item => {
    if (item.public) return true;
    if (!isAuthenticated) return false;
    if (!item.roles) return true;
    return item.roles.includes(userRole || '');
  });

  if (!mounted) return null;

  return (
    <nav className={clsx('bg-white shadow-sm border-b border-gray-100', className)} role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center" aria-label="Home">
              <ScriptHeading className="text-2xl md:text-3xl">
                WU Head TAs
              </ScriptHeading>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6" role="menubar">
              {visibleItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-charcoal hover:text-opacity-70 transition-colors duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-charcoal rounded-md px-2 py-1"
                  role="menuitem"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <Link href="/profile" tabIndex={0}>
                    <Button variant="ghost" size="sm" aria-label="View profile">
                      Profile
                    </Button>
                  </Link>
                  <Button variant="secondary" size="sm" aria-label="Sign out">
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login" tabIndex={0}>
                    <Button variant="ghost" size="sm" aria-label="Sign in">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register" tabIndex={0}>
                    <Button variant="primary" size="sm" aria-label="Sign up">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-charcoal hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-charcoal transition-colors duration-200"
              aria-expanded={isOpen}
              aria-label="Toggle navigation menu"
            >
              <span className="sr-only">Open main menu</span>
              {!isOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={clsx(
          'md:hidden fixed inset-0 z-50 bg-white transform transition-transform duration-300 ease-in-out',
          {
            'translate-x-0': isOpen,
            'translate-x-full': !isOpen,
          }
        )}
        aria-hidden={!isOpen}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
            <ScriptHeading className="text-2xl">WU Head TAs</ScriptHeading>
            <button
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center justify-center p-2 rounded-md text-charcoal hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-charcoal"
              aria-label="Close navigation menu"
            >
              <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="px-4 py-6 space-y-4" role="menu">
              {visibleItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-3 py-2 rounded-md text-base font-medium text-charcoal hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-charcoal transition-colors duration-200"
                  onClick={() => setIsOpen(false)}
                  role="menuitem"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="px-4 py-6 border-t border-gray-100">
            {isAuthenticated ? (
              <div className="space-y-4">
                <Link
                  href="/profile"
                  className="block w-full"
                  onClick={() => setIsOpen(false)}
                >
                  <Button variant="ghost" className="w-full" aria-label="View profile">
                    Profile
                  </Button>
                </Link>
                <Button variant="secondary" className="w-full" aria-label="Sign out">
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Link
                  href="/login"
                  className="block w-full"
                  onClick={() => setIsOpen(false)}
                >
                  <Button variant="ghost" className="w-full" aria-label="Sign in">
                    Sign In
                  </Button>
                </Link>
                <Link
                  href="/register"
                  className="block w-full"
                  onClick={() => setIsOpen(false)}
                >
                  <Button variant="primary" className="w-full" aria-label="Sign up">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </nav>
  );
}