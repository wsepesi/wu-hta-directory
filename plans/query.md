# Query and Data Management Best Practices

## Overview

This document outlines best practices for data fetching, state management, and cache invalidation in the WU Head TAs application. These patterns address common issues with stale data, loading states, and inconsistent user experiences that occur when mixing server-side rendering with client-side mutations.

## Current Issues Observed

### Example: Professor Management Flow
When adding a new professor through the CourseManagement component:
1. User submits form → `POST /api/professors`
2. Success → `router.refresh()` is called
3. **Problem**: The professor list doesn't update without a hard refresh
4. **Root Cause**: Static `initialProfessors` prop doesn't re-fetch on `router.refresh()`

This pattern likely exists in other areas:
- Course creation/updates
- TA assignments
- User management
- Invitation flows

## Core Principles

### 1. Command Query Separation (CQS)
- **Queries** (GET): Should be idempotent, cacheable, and side-effect free
- **Commands** (POST/PUT/DELETE): Should modify state and invalidate relevant caches

### 2. Consistent Data Flow Patterns
Choose ONE approach per feature area and stick to it:
- **Server-Side Only**: SSR with form submissions and redirects
- **Client-Side State**: React hooks with API calls and local state management
- **Hybrid**: SSR for initial load, client-side for mutations with proper cache invalidation

## Recommended Solutions

### Solution 1: Proper Cache Invalidation (Quick Fix)

```typescript
// In API routes after mutations
import { revalidatePath, revalidateTag } from 'next/cache';

// app/api/professors/route.ts
export async function POST(request: NextRequest) {
  // ... create professor logic
  
  // Invalidate specific paths
  revalidatePath('/professors');
  revalidatePath('/manage/courses'); // Anywhere professors are listed
  
  // Or use tags for more granular control
  revalidateTag('professors');
  
  return NextResponse.json({ data: professor }, { status: 201 });
}
```

### Solution 2: Client-Side State Management (Better UX)

```typescript
// components/course/CourseManagement.tsx
export function CourseManagement({ initialProfessors, ... }) {
  // Replace static props with dynamic hook
  const { professors, loading, refetch } = useProfessors();
  
  const handleProfessorSuccess = async () => {
    setShowProfessorForm(false);
    // Refetch data instead of router.refresh()
    await refetch();
    showToast('success', 'Professor added successfully');
  };
  
  // Use dynamic data
  return (
    <>
      {loading ? (
        <ProfessorSkeleton />
      ) : (
        professors.map(professor => ...)
      )}
    </>
  );
}
```

### Solution 3: Optimistic Updates (Best UX)

```typescript
// hooks/useProfessors.ts enhancement
export const useCreateProfessor = () => {
  const queryClient = useQueryClient();
  
  const createProfessor = async (data: CreateProfessorInput) => {
    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticProfessor = { ...data, id: tempId };
    
    queryClient.setQueryData(['professors'], (old: Professor[]) => [
      ...old,
      optimisticProfessor
    ]);
    
    try {
      const response = await apiClient.post('/professors', data);
      // Replace optimistic data with real data
      queryClient.setQueryData(['professors'], (old: Professor[]) =>
        old.map(p => p.id === tempId ? response.data : p)
      );
    } catch (error) {
      // Rollback on error
      queryClient.setQueryData(['professors'], (old: Professor[]) =>
        old.filter(p => p.id !== tempId)
      );
      throw error;
    }
  };
  
  return { createProfessor };
};
```

## Loading State Best Practices

### 1. Skeleton Loaders
Replace spinners with skeleton loaders that match the content structure:

```typescript
// components/professor/ProfessorSkeleton.tsx
export function ProfessorSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
    </div>
  );
}
```

### 2. Progressive Enhancement
Show partial data immediately, load details progressively:

```typescript
// Load basic info first, enhance with details
const { professors } = useProfessors(); // Basic info
const { professorDetails } = useProfessorDetails(selectedId); // On-demand
```

### 3. Error Boundaries
Implement proper error handling with recovery options:

```typescript
// components/shared/QueryErrorBoundary.tsx
export function QueryErrorBoundary({ children, fallback }) {
  return (
    <ErrorBoundary
      fallback={fallback}
      onReset={() => window.location.reload()}
    >
      {children}
    </ErrorBoundary>
  );
}
```

## Implementation Checklist

### For Each Feature Area:

- [ ] **Identify data flow pattern**: Server-side, client-side, or hybrid?
- [ ] **Implement consistent loading states**: Skeletons over spinners
- [ ] **Add proper cache invalidation**: revalidatePath/Tag for mutations
- [ ] **Consider optimistic updates**: For frequently used features
- [ ] **Add error boundaries**: With meaningful recovery options
- [ ] **Document the pattern**: In component comments

### Areas Needing Review:

1. **Professor Management** ✅ (Identified)
   - Current: Static props with router.refresh()
   - Fix: Use useProfessors hook or proper revalidation

2. **Course Management** 🔍
   - Similar pattern to professors
   - Needs consistent approach

3. **TA Assignments** 🔍
   - Complex state with multiple entities
   - Critical for optimistic updates

4. **User Management** 🔍
   - Admin area with similar patterns
   - Security considerations for caching

5. **Invitation System** 🔍
   - Tree structure makes caching complex
   - Needs careful invalidation strategy

## Migration Strategy

### Phase 1: Quick Fixes (1-2 days)
- Add revalidatePath to all mutation endpoints
- Fix immediate UX issues with loading states

### Phase 2: Standardization (1 week)
- Choose patterns for each feature area
- Implement consistent error handling
- Add skeleton loaders

### Phase 3: Optimization (2 weeks)
- Implement optimistic updates for critical paths
- Add progressive enhancement
- Performance monitoring

## Code Examples

### Pattern 1: Server-Side with Proper Invalidation
```typescript
// Best for: Admin areas, infrequent updates
// app/manage/professors/page.tsx
export default async function ManageProfessorsPage() {
  const professors = await professorRepository.findAll();
  return <ProfessorList professors={professors} />;
}

// app/api/professors/route.ts
export async function POST(request) {
  const professor = await createProfessor(data);
  revalidatePath('/manage/professors');
  return NextResponse.json(professor);
}
```

### Pattern 2: Client-Side with Hooks
```typescript
// Best for: Interactive features, frequent updates
// components/professors/ProfessorManager.tsx
export function ProfessorManager() {
  const { professors, isLoading, mutate } = useProfessors();
  
  const handleAdd = async (data) => {
    await createProfessor(data);
    mutate(); // Refetch data
  };
  
  if (isLoading) return <ProfessorSkeleton />;
  return <ProfessorList professors={professors} onAdd={handleAdd} />;
}
```

### Pattern 3: Hybrid with Suspense
```typescript
// Best for: Performance-critical pages
// app/professors/page.tsx
export default function ProfessorsPage() {
  return (
    <Suspense fallback={<ProfessorSkeleton />}>
      <ProfessorList />
    </Suspense>
  );
}

// components/professors/ProfessorList.tsx
async function ProfessorList() {
  const professors = await fetchProfessors();
  return <ClientProfessorList initialData={professors} />;
}
```

## Testing Considerations

### 1. Test Data Consistency
```typescript
// Ensure data stays in sync after mutations
it('should update professor list after creation', async () => {
  const { getByText, queryByText } = render(<CourseManagement />);
  
  // Add professor
  await userEvent.click(getByText('Add Professor'));
  await userEvent.type(getByLabelText('Name'), 'John Doe');
  await userEvent.click(getByText('Save'));
  
  // Should appear without refresh
  await waitFor(() => {
    expect(queryByText('John Doe')).toBeInTheDocument();
  });
});
```

### 2. Test Loading States
```typescript
// Ensure proper loading feedback
it('should show skeleton while loading', () => {
  mockUseProfessors.mockReturnValue({ isLoading: true });
  const { container } = render(<ProfessorList />);
  expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
});
```

### 3. Test Error Recovery
```typescript
// Ensure graceful error handling
it('should show error state with retry', async () => {
  mockUseProfessors.mockReturnValue({ error: 'Network error' });
  const { getByText } = render(<ProfessorList />);
  
  expect(getByText('Network error')).toBeInTheDocument();
  await userEvent.click(getByText('Retry'));
  expect(mockUseProfessors).toHaveBeenCalledTimes(2);
});
```

## Monitoring and Debugging

### 1. Add Logging for Cache Misses
```typescript
// lib/cache-monitor.ts
export function logCacheMiss(key: string) {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`Cache miss: ${key}`);
  }
  // In production, send to monitoring service
}
```

### 2. Track Mutation Performance
```typescript
// lib/performance.ts
export async function trackMutation(name: string, fn: () => Promise<any>) {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    console.log(`Mutation ${name} completed in ${duration}ms`);
    return result;
  } catch (error) {
    console.error(`Mutation ${name} failed`, error);
    throw error;
  }
}
```

## Conclusion

Consistent data management patterns are crucial for a good user experience. By following these practices:
- Users see immediate feedback for their actions
- Data stays consistent across the application
- Loading states are predictable and informative
- Errors are handled gracefully

The key is choosing the right pattern for each use case and implementing it consistently throughout the application.