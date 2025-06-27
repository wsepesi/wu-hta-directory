# Progressive Navigation Usage Guide

## Overview

The progressive navigation system provides enhanced navigation experiences while maintaining full functionality without JavaScript.

## Components

### 1. ProgressiveLink

Replaces standard Next.js `Link` components with enhanced functionality:

```tsx
import { ProgressiveLink } from '@/components/navigation/ProgressiveLink';

// Basic usage
<ProgressiveLink href="/courses">
  Courses
</ProgressiveLink>

// With styling
<ProgressiveLink 
  href="/profile" 
  className="text-charcoal hover:opacity-70"
>
  Profile
</ProgressiveLink>

// Disable prefetching for specific links
<ProgressiveLink href="/large-page" prefetch={false}>
  Large Page
</ProgressiveLink>
```

### 2. EnhancedNavigation

Drop-in replacement for the existing navigation:

```tsx
import { EnhancedNavigation } from '@/components/navigation/EnhancedNavigation';

// In your layout or page
export default function Layout({ children }) {
  return (
    <>
      <EnhancedNavigation />
      {children}
    </>
  );
}
```

### 3. NavigationProgress

Already integrated in the root layout, shows progress during navigation.

### 4. Route Prefetcher Hook

Use in components that need programmatic prefetching:

```tsx
import { useRoutePrefetcher } from '@/hooks/useRoutePrefetcher';

export function MyComponent() {
  const { prefetchRoute, getStats } = useRoutePrefetcher();

  // Manually prefetch a route
  const handleHover = () => {
    prefetchRoute('/important-page', { priority: 'high' });
  };

  // Get prefetch statistics
  const stats = getStats();

  return (
    <div onMouseEnter={handleHover}>
      {/* Component content */}
    </div>
  );
}
```

## Features

### 1. View Transitions (when supported)

Automatic smooth transitions between pages using the View Transitions API.

### 2. Intelligent Prefetching

- Hover/focus prefetching with delay
- Pattern-based prefetching
- Viewport-based prefetching for visible links

### 3. Progressive Enhancement

- All navigation works without JavaScript
- Enhanced experience when JavaScript is available
- Graceful fallbacks for older browsers

### 4. Offline Support

- Service worker caches navigation routes
- Stale-while-revalidate strategy for fast navigation
- Offline page fallback

## Migration Guide

To migrate existing navigation:

1. Replace `Link` imports:
```tsx
// Before
import Link from 'next/link';

// After
import { ProgressiveLink as Link } from '@/components/navigation/ProgressiveLink';
```

2. Or update individual links:
```tsx
// Before
<Link href="/courses">Courses</Link>

// After
<ProgressiveLink href="/courses">Courses</ProgressiveLink>
```

3. Replace navigation component:
```tsx
// Before
<NavigationWithSearch />

// After
<EnhancedNavigation />
```

## CSS Classes for Progressive Enhancement

Use these classes in your components:

- `.js-only` - Hidden by default, shown when JS is available
- `.no-js-only` - Shown by default, hidden when JS is available

Example:
```tsx
<div className="no-js-only">
  <a href="/courses">View Courses</a>
</div>
<div className="js-only">
  <button onClick={handleNavigation}>View Courses</button>
</div>
```