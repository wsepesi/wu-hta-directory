"use client";

import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { SearchWithHighlight } from "../search/SearchWithHighlight";
import { ProgressiveLink } from "./ProgressiveLink";
import { clsx } from "clsx";

export function EnhancedNavigation() {
  const { data: session, status } = useSession();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: "/" });
  };

  const navItems = [
    { href: "/directory", label: "Directory" },
    { href: "/courses", label: "Courses" },
    { href: "/semesters", label: "Semesters" },
    { href: "/people", label: "People" },
    { href: "/professors", label: "Professors" },
  ];

  const adminItems = [
    { href: "/admin", label: "Admin Dashboard" },
    { href: "/admin/users", label: "Manage Users" },
    { href: "/admin/invitations", label: "Invitations" },
  ];

  const isAdmin = session?.user?.role === "admin";
  const isAuthenticated = status === "authenticated";

  return (
    <nav className="bg-white" role="navigation" aria-label="Main navigation">
      <div className="max-w-4xl mx-auto px-8 py-6">
        <div className="flex justify-between items-center">
          {/* Logo and primary nav */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <ProgressiveLink 
                href="/" 
                className="font-serif text-xl text-charcoal hover:opacity-70 transition-opacity duration-200"
                aria-label="WU Head TAs Home"
              >
                <em>WU Head TAs</em>
              </ProgressiveLink>
            </div>
            <div className="hidden sm:ml-12 sm:flex sm:space-x-12">
              {navItems.map((item) => (
                <ProgressiveLink
                  key={item.href}
                  href={item.href}
                  className="font-serif text-sm uppercase tracking-wider text-charcoal hover:opacity-70 transition-opacity duration-200"
                >
                  {item.label}
                </ProgressiveLink>
              ))}
              {isAdmin && (
                <div className="relative group">
                  <button 
                    className="font-serif text-sm uppercase tracking-wider text-charcoal hover:opacity-70 transition-opacity duration-200 flex items-center"
                    aria-expanded="false"
                    aria-haspopup="true"
                  >
                    Admin
                    <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div className="absolute left-0 mt-2 w-48 bg-white border border-charcoal opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200">
                    <div className="py-1">
                      {adminItems.map((item) => (
                        <ProgressiveLink
                          key={item.href}
                          href={item.href}
                          className="block px-4 py-2 font-serif text-sm text-charcoal hover:opacity-70 transition-opacity duration-200"
                        >
                          {item.label}
                        </ProgressiveLink>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search and user menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && (
              <div className="hidden md:block">
                <SearchWithHighlight className="w-64" />
              </div>
            )}

            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <ProgressiveLink
                  href="/profile"
                  className="font-serif text-sm uppercase tracking-wider text-charcoal hover:opacity-70 transition-opacity duration-200"
                >
                  {session.user.firstName} {session.user.lastName}
                </ProgressiveLink>
                <button
                  onClick={handleSignOut}
                  className="font-serif text-sm uppercase tracking-wider text-charcoal hover:opacity-70 transition-opacity duration-200"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <ProgressiveLink
                  href="/auth/signin"
                  className="font-serif text-sm uppercase tracking-wider text-charcoal hover:opacity-70 transition-opacity duration-200"
                >
                  Sign In
                </ProgressiveLink>
                <ProgressiveLink
                  href="/auth/register"
                  className="font-serif text-sm uppercase tracking-wider text-charcoal border border-charcoal px-4 py-2 hover:opacity-70 transition-opacity duration-200"
                >
                  Sign Up
                </ProgressiveLink>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="inline-flex items-center justify-center p-2 text-charcoal hover:opacity-70 transition-opacity duration-200"
                aria-expanded={showMobileMenu}
                aria-label="Toggle navigation menu"
              >
                <svg
                  className={clsx("h-6 w-6", showMobileMenu ? "hidden" : "block")}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <svg
                  className={clsx("h-6 w-6", showMobileMenu ? "block" : "hidden")}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile search */}
        {isAuthenticated && (
          <div className="md:hidden py-3">
            <SearchWithHighlight className="w-full" />
          </div>
        )}
      </div>

      {/* Mobile menu */}
      <div className={clsx("sm:hidden", showMobileMenu ? "block" : "hidden")}>
        <div className="pt-2 pb-3 space-y-1">
          {navItems.map((item) => (
            <ProgressiveLink
              key={item.href}
              href={item.href}
              className="block pl-3 pr-4 py-2 font-serif text-sm uppercase tracking-wider text-charcoal hover:opacity-70 transition-opacity duration-200"
              onClick={() => setShowMobileMenu(false)}
            >
              {item.label}
            </ProgressiveLink>
          ))}
          {isAdmin && adminItems.map((item) => (
            <ProgressiveLink
              key={item.href}
              href={item.href}
              className="block pl-3 pr-4 py-2 font-serif text-sm uppercase tracking-wider text-charcoal hover:opacity-70 transition-opacity duration-200"
              onClick={() => setShowMobileMenu(false)}
            >
              {item.label}
            </ProgressiveLink>
          ))}
        </div>
      </div>
    </nav>
  );
}