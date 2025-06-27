# Testing Strategy for WU Head TAs

## Executive Summary

This document outlines a pragmatic testing strategy that focuses on critical failure points rather than achieving high coverage metrics. We prioritize tests that catch real bugs in production-like scenarios over tests that merely exercise code.

## Current State Analysis

### What Exists Now
- **Empty Test Files**: Many test files exist but contain no actual tests (admin-logic.test.ts, semester-utils.test.ts, permissions.test.ts, ta-assignment-logic.test.ts, invitation-logic.test.ts, course-logic.test.ts)
- **Mock/Import Errors**: Tests have Request/Response mocking issues and import problems
- **Database Connection Issues**: Integration tests timeout during database setup/cleanup
- **Disabled State**: Tests are referenced as disabled in CLAUDE.md
- **Test Results**: 33 test suites failed, 1 passed, with 98 failed tests and 10 passed tests out of 123 total

### Why This Approach Fails
1. **Incomplete Implementation**: Many test files were created but never implemented
2. **Environment Issues**: Database connection problems prevent integration tests from running
3. **Mock Configuration**: Request/Response mocking not properly configured for Next.js environment
4. **Maintenance Burden**: Tests not maintained as codebase evolved

## Proposed Testing Strategy

### Core Principles

1. **Test at System Boundaries**: Focus on where external systems meet our code
2. **Real Dependencies When Critical**: Use actual database for data integrity tests
3. **Mock Only When Necessary**: External APIs, payment systems, email services
4. **Behavior Over Implementation**: Test what the system does, not how
5. **Critical Paths First**: Prioritize tests that prevent data corruption or security breaches

### Testing Pyramid (Inverted)

```
┌─────────────────────┐
│ Integration Tests   │ ← 30-40 database/API tests
├─────────────────────┤
│   Unit Tests        │ ← 20-30 complex logic tests
└─────────────────────┘
```

## Critical Test Categories

### 1. Data Integrity Tests (Priority: CRITICAL)

**File**: `__tests__/integration/data-integrity.test.ts`

```typescript
describe('Data Integrity', () => {
  // Prevent duplicate TA assignments
  test('prevents assigning same TA to course twice', async () => {
    await withTestDB(async () => {
      const ta = await createUser({ role: 'head_ta' });
      const offering = await createCourseOffering();
      
      await TAAssignmentRepository.create({ userId: ta.id, offeringId: offering.id });
      
      // This MUST fail
      await expect(
        TAAssignmentRepository.create({ userId: ta.id, offeringId: offering.id })
      ).rejects.toThrow();
    });
  });

  // Prevent invitation cycles
  test('prevents circular invitation references', async () => {
    await withTestDB(async () => {
      const userA = await createUser();
      const userB = await createUser({ invitedById: userA.id });
      
      // Attempting to make A invited by B should fail
      await expect(
        UserRepository.update(userA.id, { invitedById: userB.id })
      ).rejects.toThrow('Circular invitation detected');
    });
  });

  // Cascade deletes work correctly
  test('deleting course offering removes all TA assignments', async () => {
    await withTestDB(async () => {
      const offering = await createCourseOffering();
      const ta1 = await createUser({ role: 'head_ta' });
      const ta2 = await createUser({ role: 'head_ta' });
      
      await TAAssignmentRepository.create({ userId: ta1.id, offeringId: offering.id });
      await TAAssignmentRepository.create({ userId: ta2.id, offeringId: offering.id });
      
      await CourseOfferingRepository.delete(offering.id);
      
      const assignments = await TAAssignmentRepository.findByOffering(offering.id);
      expect(assignments).toHaveLength(0);
    });
  });
});
```

### 2. Authorization Boundary Tests (Priority: CRITICAL)

**File**: `__tests__/integration/authorization.test.ts`

```typescript
describe('Authorization Boundaries', () => {
  // Role escalation prevention
  test('non-admin cannot grant admin role', async () => {
    const normalUser = await createAuthenticatedUser({ role: 'head_ta' });
    const targetUser = await createUser({ role: 'head_ta' });
    
    const response = await apiClient
      .as(normalUser)
      .post(`/api/users/${targetUser.id}/toggle-role`);
    
    expect(response.status).toBe(403);
    
    // Verify role unchanged in DB
    const user = await UserRepository.findById(targetUser.id);
    expect(user.role).toBe('head_ta');
  });

  // Privacy filter enforcement
  test('privacy settings prevent unauthorized data access', async () => {
    const privateUser = await createUser({
      isProfilePublic: false,
      showEmail: false,
      showCourses: false
    });
    
    const otherUser = await createAuthenticatedUser();
    
    const response = await apiClient
      .as(otherUser)
      .get(`/api/users/${privateUser.id}`);
    
    expect(response.data).not.toHaveProperty('email');
    expect(response.data).not.toHaveProperty('courseAssignments');
  });

  // Session expiry handling
  test('expired sessions are rejected', async () => {
    const user = await createAuthenticatedUser();
    const expiredToken = await createExpiredSessionToken(user);
    
    const response = await apiClient
      .withToken(expiredToken)
      .get('/api/users/me');
    
    expect(response.status).toBe(401);
  });
});
```

### 3. Critical Business Logic Tests (Priority: HIGH)

**File**: `__tests__/integration/business-logic.test.ts`

```typescript
describe('Critical Business Logic', () => {
  // TA workload calculation
  test('correctly calculates TA workload across semesters', async () => {
    await withTestDB(async () => {
      const ta = await createUser({ role: 'head_ta' });
      
      // Create assignments across multiple semesters
      await createTAAssignment(ta, 'CS 131', 'SP2024');
      await createTAAssignment(ta, 'CS 247', 'SP2024');
      await createTAAssignment(ta, 'CS 332', 'FA2024');
      
      const workload = await TAAssignmentLogic.calculateWorkload(ta.id, 'SP2024');
      
      expect(workload.currentSemester).toBe(2);
      expect(workload.totalHistorical).toBe(3);
      expect(workload.courses).toContain('CS 131');
      expect(workload.courses).toContain('CS 247');
    });
  });

  // Course prediction algorithm
  test('predicts course offerings based on historical patterns', async () => {
    await withTestDB(async () => {
      // Seed historical data - CS 131 offered every fall
      await createCourseOffering('CS 131', 'FA2021');
      await createCourseOffering('CS 131', 'FA2022');
      await createCourseOffering('CS 131', 'FA2023');
      
      const predictions = await CourseLogic.predictOfferings('FA2024');
      
      expect(predictions).toContainEqual(
        expect.objectContaining({
          courseNumber: 'CS 131',
          confidence: expect.any(Number),
          semester: 'FA2024'
        })
      );
      
      // Should not predict for spring
      const springPredictions = await CourseLogic.predictOfferings('SP2024');
      expect(springPredictions).not.toContainEqual(
        expect.objectContaining({ courseNumber: 'CS 131' })
      );
    });
  });

  // Invitation tree depth limits
  test('enforces maximum invitation tree depth', async () => {
    await withTestDB(async () => {
      let previousUser = await createUser();
      
      // Create chain of invitations
      for (let i = 0; i < 10; i++) {
        previousUser = await createUser({ invitedById: previousUser.id });
      }
      
      // 11th level should fail
      await expect(
        createUser({ invitedById: previousUser.id })
      ).rejects.toThrow('Maximum invitation depth exceeded');
    });
  });
});
```

### 4. Race Condition Tests (Priority: HIGH)

**File**: `__tests__/integration/concurrency.test.ts`

```typescript
describe('Concurrency and Race Conditions', () => {
  test('handles concurrent TA assignments gracefully', async () => {
    await withTestDB(async () => {
      const ta = await createUser({ role: 'head_ta' });
      const offering = await createCourseOffering();
      
      // Simulate concurrent requests
      const promises = Array(5).fill(null).map(() => 
        TAAssignmentRepository.create({ userId: ta.id, offeringId: offering.id })
      );
      
      const results = await Promise.allSettled(promises);
      
      // Exactly one should succeed
      const succeeded = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');
      
      expect(succeeded).toHaveLength(1);
      expect(failed).toHaveLength(4);
      
      // Verify only one assignment in DB
      const assignments = await TAAssignmentRepository.findByUser(ta.id);
      expect(assignments).toHaveLength(1);
    });
  });

  test('prevents invitation code race conditions', async () => {
    await withTestDB(async () => {
      const invitation = await createInvitation();
      
      // Multiple users trying to use same code
      const promises = Array(3).fill(null).map((_, i) => 
        InvitationLogic.redeemCode(invitation.code, `user${i}@test.com`)
      );
      
      const results = await Promise.allSettled(promises);
      
      // Only one should succeed
      const succeeded = results.filter(r => r.status === 'fulfilled');
      expect(succeeded).toHaveLength(1);
      
      // Invitation should be used
      const updated = await InvitationRepository.findByCode(invitation.code);
      expect(updated.used).toBe(true);
    });
  });
});
```

### 5. API Contract Tests (Priority: MEDIUM)

**File**: `__tests__/integration/api-contracts.test.ts`

```typescript
describe('API Contract Tests', () => {
  test('course search returns expected shape', async () => {
    await withTestDB(async () => {
      await createCourseWithOfferings();
      
      const response = await apiClient.get('/api/search?q=algorithms');
      
      expect(response.data).toMatchObject({
        courses: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            courseNumber: expect.any(String),
            title: expect.any(String),
            currentOffering: expect.objectContaining({
              semester: expect.stringMatching(/^(SP|SU|FA)\d{4}$/),
              professors: expect.any(Array)
            })
          })
        ]),
        users: expect.any(Array),
        professors: expect.any(Array)
      });
    });
  });

  test('pagination works correctly', async () => {
    await withTestDB(async () => {
      // Create 25 users
      await Promise.all(
        Array(25).fill(null).map((_, i) => createUser({ name: `User ${i}` }))
      );
      
      const page1 = await apiClient.get('/api/users?page=1&limit=10');
      const page2 = await apiClient.get('/api/users?page=2&limit=10');
      const page3 = await apiClient.get('/api/users?page=3&limit=10');
      
      expect(page1.data.users).toHaveLength(10);
      expect(page2.data.users).toHaveLength(10);
      expect(page3.data.users).toHaveLength(5);
      
      // No duplicate IDs across pages
      const allIds = [
        ...page1.data.users.map(u => u.id),
        ...page2.data.users.map(u => u.id),
        ...page3.data.users.map(u => u.id)
      ];
      expect(new Set(allIds).size).toBe(25);
    });
  });
});
```

## Implementation Plan

### Phase 1: Testing Infrastructure (Week 1)
1. Set up Supabase local database for testing
2. Create `withTestDB` utility for isolated tests
3. Create data factory functions
4. Set up API test client

### Phase 2: Critical Tests (Week 2-3)
1. Implement data integrity tests
2. Implement authorization boundary tests
3. Implement concurrency tests

### Phase 3: Business Logic Tests (Week 4)
1. Implement workload calculation tests
2. Implement prediction algorithm tests
3. Implement invitation system tests

### Phase 4: API Integration Tests (Week 5)
1. Implement comprehensive API contract tests
2. Test critical user flows via API endpoints
3. Add to CI pipeline

## Test Infrastructure

### Supabase Local Database Setup

We'll use Supabase's local development environment to provide a real PostgreSQL database for testing. This gives us:

- Real database constraints and behaviors
- Isolated test environments per test suite
- Fast parallel test execution
- No mocking of database interactions

```typescript
// test/supabase-setup.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function startSupabaseLocal() {
  // Start Supabase local services
  await execAsync('npx supabase start');
  
  // Get the local database URL
  const { stdout } = await execAsync('npx supabase status -o json');
  const status = JSON.parse(stdout);
  
  return {
    databaseUrl: status.db_url,
    apiUrl: status.api_url
  };
}

export async function createTestSchema() {
  // Create isolated schema for this test run
  const schemaName = `test_${process.env.JEST_WORKER_ID || Date.now()}`;
  
  await sql`CREATE SCHEMA IF NOT EXISTS ${schemaName}`;
  await sql`SET search_path TO ${schemaName}`;
  
  // Run migrations in test schema
  await runMigrations(schemaName);
  
  return schemaName;
}

export async function withTestDB(fn: () => Promise<void>) {
  const schema = await createTestSchema();
  
  try {
    // Set schema for all queries in this test
    await sql`SET search_path TO ${schema}`;
    await fn();
  } finally {
    // Clean up test schema
    await sql`DROP SCHEMA ${schema} CASCADE`;
  }
}

// jest.setup.js
beforeAll(async () => {
  // Start Supabase once for all tests
  const { databaseUrl } = await startSupabaseLocal();
  process.env.DATABASE_URL = databaseUrl;
});

afterAll(async () => {
  // Stop Supabase after all tests
  await execAsync('npx supabase stop');
});
```

### API Test Client

```typescript
// test/api-client.ts
class TestAPIClient {
  private token?: string;
  
  as(user: User) {
    this.token = generateTestToken(user);
    return this;
  }
  
  async get(path: string) {
    return fetch(`http://localhost:3000${path}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
  }
  
  // ... other methods
}
```

## What We DON'T Test

1. **Simple CRUD**: If it's just `repository.create(data)`, skip it
2. **UI Components**: Unless they contain critical business logic
3. **Third-party libraries**: NextAuth, Drizzle, etc.
4. **Getters/Setters**: Trivial property access
5. **Framework behavior**: Next.js routing, React rendering

## Success Metrics

- **Deployment confidence**: Can deploy without manual testing
- **Bug detection rate**: Catches 90% of production issues
- **Test execution time**: Full suite runs in < 5 minutes
- **Maintenance burden**: Tests change only when behavior changes
- **False positive rate**: < 1% flaky tests

## Migration Strategy

1. **Keep existing tests disabled** until new tests prove stable
2. **Start with highest-risk areas**: Authorization and data integrity
3. **Add tests when fixing bugs**: Regression test for each bug
4. **Review weekly**: Which tests caught real issues?
5. **Prune aggressively**: Delete tests that don't provide value

## Conclusion

This strategy prioritizes catching real bugs over achieving coverage metrics. By focusing on system boundaries, data integrity, and critical business logic, we can maintain confidence in our application with a manageable test suite that actually prevents production issues.

## Implementation Progress

### ✅ Current Status (Implemented - December 2024)

**Phase 1: Testing Infrastructure**
- ✅ Database connection with lazy loading implemented (`lib/db/connection.ts`)
- ✅ Test utilities created:
  - ✅ `test/db-helpers.ts` - Transaction-based test isolation
  - ✅ `test/api-client.ts` - API testing client
  - ✅ `test/factories/index.ts` - Comprehensive test data factories
- ✅ Jest configuration consolidated and cleaned up
- ✅ Separate configs for unit and integration tests

**Phase 2: Critical Tests**
- ✅ **Data Integrity Tests** (`__tests__/integration/data-integrity.test.ts`)
  - Tests for duplicate TA assignments, cascade deletes, foreign key constraints
  - Transaction consistency and unique constraint enforcement

- ✅ **Authorization Boundary Tests** (`__tests__/integration/authorization.test.ts`)
  - Role escalation prevention, privacy filter enforcement
  - Session expiry handling, protected endpoint access

- ✅ **Concurrency Tests** (`__tests__/integration/concurrency.test.ts`)
  - Concurrent TA assignments, invitation code race conditions
  - Database transaction isolation

**Phase 3: Business Logic Tests**
- ✅ **Critical Business Logic** (`__tests__/integration/business-logic.test.ts`)
  - TA workload calculation across semesters
  - Course prediction algorithm based on historical patterns
  - Invitation tree depth tracking

**Phase 4: API Integration Tests**
- ✅ **API Contract Tests** (`__tests__/integration/api-contracts.test.ts`)
  - Search API response shape validation
  - Pagination functionality
  - Error response consistency
  - Data type validation

- ✅ **Critical User Flows** (`__tests__/integration/critical-user-flows.test.ts`)
  - User registration and login flow
  - TA assignment flow
  - Privacy settings flow
  - Search and discovery flow
  - Admin management flow

### Implementation Summary

The testing infrastructure has been fully implemented according to the plan:

1. **Database Setup**: 
   - Implemented lazy-loaded database connections to prevent initialization timeouts
   - Created transaction-based test isolation using `withTestDB`
   - Tests use postgres.js directly (not Supabase as originally planned)

2. **Test Utilities Created**:
   - `test/db-helpers.ts` - Database isolation and cleanup utilities
   - `test/api-client.ts` - API testing client with authentication
   - `test/factories/index.ts` - Comprehensive data factories

3. **Test Coverage**:
   - Data integrity tests with foreign key and constraint validation
   - Authorization tests covering all security boundaries
   - Concurrency tests for race conditions
   - Business logic tests for core algorithms
   - API contract tests for frontend stability
   - End-to-end user flow tests

### Running the Tests

```bash
# Run all tests
npm run test:all

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run with coverage
npm run test:coverage
npm run test:integration:coverage

# Watch mode for development
npm run test:watch
npm run test:integration:watch
```

### Prerequisites

1. **PostgreSQL Database**: Tests require a running PostgreSQL instance
2. **Test Database**: Create a test database:
   ```bash
   createdb test
   ```
3. **Environment Variables**: Set `TEST_DATABASE_URL` or it will default to:
   ```
   postgresql://test:test@localhost:5432/test
   ```

### Next Steps

- Enable tests in CI/CD pipeline
- Monitor test execution times and optimize if needed
- Add tests for new features as they're developed
- Review and prune tests that don't provide value
- Consider adding E2E tests with Playwright for critical UI flows