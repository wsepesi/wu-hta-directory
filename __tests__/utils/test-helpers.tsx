/*
import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'

// Mock session data
export const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'admin' as const,
  },
  expires: '2024-12-31',
}

// Mock user data for tests
export const mockUsers = [
  {
    id: '1',
    email: 'admin@test.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin' as const,
    gradYear: 2024,
    degreeProgram: 'Computer Science',
    currentRole: 'Administrator',
    linkedinUrl: 'https://linkedin.com/in/admin',
    personalSite: 'https://admin.example.com',
    location: 'St. Louis, MO',
    invitedBy: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    email: 'ta@test.com',
    firstName: 'TA',
    lastName: 'User',
    role: 'head_ta' as const,
    gradYear: 2025,
    degreeProgram: 'Computer Science',
    currentRole: 'Teaching Assistant',
    linkedinUrl: 'https://linkedin.com/in/ta',
    personalSite: 'https://ta.example.com',
    location: 'St. Louis, MO',
    invitedBy: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    email: 'user@test.com',
    firstName: 'Regular',
    lastName: 'User',
    role: 'head_ta' as const,
    gradYear: 2026,
    degreeProgram: 'Computer Science',
    currentRole: 'Student',
    linkedinUrl: 'https://linkedin.com/in/user',
    personalSite: 'https://user.example.com',
    location: 'St. Louis, MO',
    invitedBy: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

// Mock course data
export const mockCourses = [
  {
    id: '1',
    courseNumber: 'CS 101',
    courseName: 'Introduction to Computer Science',
    description: 'Basic programming concepts',
    credits: 3,
    department: 'Computer Science',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    courseNumber: 'CS 201',
    courseName: 'Data Structures',
    description: 'Advanced data structures and algorithms',
    credits: 4,
    department: 'Computer Science',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

// Mock activity data
export const mockActivities = [
  {
    id: '1',
    userId: '1',
    action: 'USER_CREATED',
    entityType: 'USER',
    entityId: '2',
    metadata: { email: 'ta@test.com' },
    timestamp: new Date(),
  },
  {
    id: '2',
    userId: '1',
    action: 'ROLE_CHANGED',
    entityType: 'USER',
    entityId: '2',
    metadata: { oldRole: 'user', newRole: 'ta' },
    timestamp: new Date(),
  },
]

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  session?: any
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: CustomRenderOptions
) {
  const { session = mockSession, ...renderOptions } = options || {}

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <SessionProvider session={session}>
        {children}
      </SessionProvider>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Mock fetch responses
export function mockFetch(data: any, status = 200) {
  return jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
  })
}

// Wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

// Generate mock data with specified count
export function generateMockUsers(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `user-${i}`,
    email: `user${i}@test.com`,
    firstName: `User`,
    lastName: `${i}`,
    role: i % 10 === 0 ? 'admin' : 'head_ta',
    gradYear: 2024 + (i % 4),
    degreeProgram: 'Computer Science',
    currentRole: i % 10 === 0 ? 'Administrator' : 'Student',
    linkedinUrl: `https://linkedin.com/in/user${i}`,
    personalSite: `https://user${i}.example.com`,
    location: 'St. Louis, MO',
    invitedBy: i === 0 ? null : 'user-0',
    createdAt: new Date(Date.now() - i * 86400000), // Stagger creation dates
    updatedAt: new Date(),
  }))
}

export function generateMockCourses(count: number) {
  const departments = ['Computer Science', 'Mathematics', 'Physics', 'Chemistry']
  return Array.from({ length: count }, (_, i) => ({
    id: `course-${i}`,
    courseNumber: `CS ${100 + i}`,
    courseName: `Course ${i}`,
    description: `Description for course ${i}`,
    credits: 3 + (i % 2),
    department: departments[i % departments.length],
    createdAt: new Date(),
    updatedAt: new Date(),
  }))
}

// Performance testing utilities
export function measureRenderTime(component: React.ReactElement) {
  const start = performance.now()
  const result = renderWithProviders(component)
  const end = performance.now()
  return {
    ...result,
    renderTime: end - start,
  }
}

export async function measureApiResponseTime(apiCall: () => Promise<any>) {
  const start = performance.now()
  const result = await apiCall()
  const end = performance.now()
  return {
    result,
    responseTime: end - start,
  }
}
*/