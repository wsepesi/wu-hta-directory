"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SearchWithHighlight } from "../search/SearchWithHighlight";

export function NavigationWithSearch() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: "/" });
  };

  const navItems = [
    { href: "/directory", label: "Directory", public: true },
    { href: "/courses", label: "Courses", public: false },
    { href: "/semesters", label: "Semesters", public: false },
    { href: "/people", label: "People", public: false },
    { href: "/professors", label: "Professors", public: false },
  ];

  const adminItems = [
    { href: "/admin", label: "Admin Dashboard" },
    { href: "/admin/users", label: "Manage Users" },
    { href: "/admin/invitations", label: "Invitations" },
  ];

  const isAdmin = session?.user?.role === "admin";
  const isAuthenticated = status === "authenticated";

  const visibleItems = navItems.filter(item => {
    if (item.public) return true;
    return isAuthenticated;
  });

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and primary nav */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">
                WU Head TAs
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {visibleItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 hover:border-gray-300"
                >
                  {item.label}
                </Link>
              ))}
              {isAdmin && (
                <div className="relative group">
                  <button className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900">
                    Admin
                    <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="py-1">
                      {adminItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          {item.label}
                        </Link>
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
                <Link
                  href="/profile"
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  {session.user.firstName} {session.user.lastName}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/auth/login"
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <svg
                  className={`${showMobileMenu ? "hidden" : "block"} h-6 w-6`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <svg
                  className={`${showMobileMenu ? "block" : "hidden"} h-6 w-6`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
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
      <div className={`${showMobileMenu ? "block" : "hidden"} sm:hidden`}>
        <div className="pt-2 pb-3 space-y-1">
          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block pl-3 pr-4 py-2 text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            >
              {item.label}
            </Link>
          ))}
          {isAdmin && adminItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block pl-3 pr-4 py-2 text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}