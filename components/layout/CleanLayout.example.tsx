/**
 * Example usage of CleanLayout component
 * This file demonstrates various ways to use the CleanLayout component
 */

import CleanLayout, { CleanPageHeader, CleanNavigation } from './CleanLayout';

// Example 1: Basic usage with default settings
export function BasicExample() {
  return (
    <CleanLayout>
      <h1 className="text-3xl font-serif text-charcoal mb-8">
        Basic Page Title
      </h1>
      <p className="text-lg leading-relaxed">
        This is a basic example using default settings: max-width-4xl, large padding, white background.
      </p>
    </CleanLayout>
  );
}

// Example 2: Centered content with custom max width
export function CenteredExample() {
  return (
    <CleanLayout center maxWidth="2xl">
      <h1 className="text-4xl font-serif text-charcoal mb-8">
        Centered Content
      </h1>
      <p className="text-lg leading-relaxed mb-12">
        This content is centered with a narrower max width for better readability.
      </p>
      <button className="px-6 py-3 bg-charcoal text-white rounded hover:opacity-90 transition-opacity">
        Call to Action
      </button>
    </CleanLayout>
  );
}

// Example 3: Using CleanPageHeader component
export function WithHeaderExample() {
  return (
    <CleanLayout center>
      <CleanPageHeader
        title="Professor Directory"
        subtitle="Washington University Computer Science Faculty"
        description="Browse our distinguished faculty members who mentor and work with head teaching assistants across various computer science courses."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
        {/* Content grid here */}
      </div>
    </CleanLayout>
  );
}

// Example 4: With navigation
export function WithNavigationExample() {
  const navLinks = [
    { href: '/directory', label: 'Browse Directory' },
    { href: '/courses', label: 'Courses' },
    { href: '/professors', label: 'Faculty' },
    { href: '/auth/signin', label: 'Sign In' },
  ];

  return (
    <CleanLayout center>
      <CleanPageHeader
        subtitle="Washington University Computer Science Head TA Directory"
        description="Connect with head teaching assistants, explore courses, and learn about our CS community."
      />
      <CleanNavigation links={navLinks} />
    </CleanLayout>
  );
}

// Example 5: Custom styling with className props
export function CustomStyledExample() {
  return (
    <CleanLayout 
      className="bg-gradient-to-b from-white to-gray-50"
      contentClassName="animate-fade-in"
      padding="xl"
    >
      <h1 className="text-5xl font-serif text-charcoal mb-12">
        Custom Styled Page
      </h1>
      <div className="prose prose-lg max-w-none">
        <p>
          This example shows how to add custom classes while maintaining the clean layout structure.
          The outer container has a subtle gradient, and the content has a fade-in animation.
        </p>
      </div>
    </CleanLayout>
  );
}

// Example 6: Refactoring an existing page
export function RefactoredProfessorsPage() {
  return (
    <CleanLayout maxWidth="7xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-serif text-charcoal">
          Professor Directory
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Professors who work with head TAs
        </p>
      </div>

      {/* Search section */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        {/* Search form */}
      </div>

      {/* Results grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Professor cards */}
      </div>
    </CleanLayout>
  );
}