import React from 'react'
import { screen } from '@testing-library/react'
import ActivityFeed from '@/components/admin/ActivityFeed'
import { renderWithProviders } from '../utils/test-helpers'

describe('ActivityFeed Component', () => {
  const mockActivities = [
    {
      id: '1',
      type: 'user' as const,
      description: 'New user registered: John Doe',
      timestamp: new Date(Date.now() - 30000), // 30 seconds ago
      metadata: {
        userId: 'user-1',
        userName: 'John Doe',
        email: 'john@example.com',
      },
    },
    {
      id: '2',
      type: 'ta_assignment' as const,
      description: 'TA assigned to CS 101',
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      metadata: {
        userId: 'user-2',
        courseId: 'course-1',
        courseName: 'CS 101',
      },
    },
    {
      id: '3',
      type: 'invitation' as const,
      description: 'Invitation sent to jane@example.com',
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      metadata: {
        email: 'jane@example.com',
      },
    },
    {
      id: '4',
      type: 'course' as const,
      description: 'New course created: CS 301',
      timestamp: new Date(Date.now() - 86400000), // 1 day ago
      metadata: {
        courseId: 'course-2',
        courseName: 'CS 301',
      },
    },
    {
      id: '5',
      type: 'professor' as const,
      description: 'Professor added: Dr. Smith',
      timestamp: new Date(Date.now() - 604800000), // 7 days ago
    },
    {
      id: '6',
      type: 'system' as const,
      description: 'System maintenance completed',
      timestamp: new Date(Date.now() - 2592000000), // 30 days ago
    },
  ]

  it('should render activities correctly', () => {
    renderWithProviders(<ActivityFeed activities={mockActivities} />)
    
    expect(screen.getByText('New user registered: John Doe')).toBeInTheDocument()
    expect(screen.getByText('TA assigned to CS 101')).toBeInTheDocument()
    expect(screen.getByText('Invitation sent to jane@example.com')).toBeInTheDocument()
    expect(screen.getByText('New course created: CS 301')).toBeInTheDocument()
    expect(screen.getByText('Professor added: Dr. Smith')).toBeInTheDocument()
    expect(screen.getByText('System maintenance completed')).toBeInTheDocument()
  })

  it('should format timestamps correctly', () => {
    renderWithProviders(<ActivityFeed activities={mockActivities} />)
    
    expect(screen.getByText('Just now')).toBeInTheDocument() // 30 seconds ago
    expect(screen.getByText('5m ago')).toBeInTheDocument() // 5 minutes ago
    expect(screen.getByText('1h ago')).toBeInTheDocument() // 1 hour ago
    expect(screen.getByText('1d ago')).toBeInTheDocument() // 1 day ago
    expect(screen.getByText('7d ago')).toBeInTheDocument() // 7 days ago
    // 30 days ago should show as date
    const dateRegex = /\d{1,2}\/\d{1,2}\/\d{4}/
    const dateElements = screen.getAllByText(dateRegex)
    expect(dateElements.length).toBeGreaterThan(0)
  })

  it('should respect maxItems prop', () => {
    renderWithProviders(<ActivityFeed activities={mockActivities} maxItems={3} />)
    
    expect(screen.getByText('New user registered: John Doe')).toBeInTheDocument()
    expect(screen.getByText('TA assigned to CS 101')).toBeInTheDocument()
    expect(screen.getByText('Invitation sent to jane@example.com')).toBeInTheDocument()
    expect(screen.queryByText('New course created: CS 301')).not.toBeInTheDocument()
  })

  it('should use default maxItems of 10', () => {
    const manyActivities = Array.from({ length: 15 }, (_, i) => ({
      id: `activity-${i}`,
      type: 'user' as const,
      description: `Activity ${i}`,
      timestamp: new Date(),
    }))
    
    renderWithProviders(<ActivityFeed activities={manyActivities} />)
    
    // Should show first 10
    for (let i = 0; i < 10; i++) {
      expect(screen.getByText(`Activity ${i}`)).toBeInTheDocument()
    }
    // Should not show 11th and beyond
    expect(screen.queryByText('Activity 10')).not.toBeInTheDocument()
  })

  it('should render correct activity type icons and colors', () => {
    renderWithProviders(<ActivityFeed activities={mockActivities} />)
    
    // Check for icon letters
    expect(screen.getByText('U')).toBeInTheDocument() // User
    expect(screen.getByText('A')).toBeInTheDocument() // TA Assignment
    expect(screen.getByText('I')).toBeInTheDocument() // Invitation
    expect(screen.getByText('C')).toBeInTheDocument() // Course
    expect(screen.getByText('P')).toBeInTheDocument() // Professor
    expect(screen.getByText('S')).toBeInTheDocument() // System
  })

  it('should handle empty activities array', () => {
    renderWithProviders(<ActivityFeed activities={[]} />)
    
    const list = screen.getByRole('list')
    expect(list).toBeInTheDocument()
    expect(list.children).toHaveLength(0)
  })

  it('should render timeline connector lines correctly', () => {
    renderWithProviders(<ActivityFeed activities={mockActivities.slice(0, 3)} />)
    
    // Should have connector lines for all but the last item
    const connectorLines = document.querySelectorAll('.bg-gray-200')
    expect(connectorLines).toHaveLength(2) // 3 items = 2 connectors
  })

  it('should handle activities with partial metadata', () => {
    const partialMetadataActivities = [
      {
        id: '1',
        type: 'user' as const,
        description: 'User action without metadata',
        timestamp: new Date(),
      },
      {
        id: '2',
        type: 'ta_assignment' as const,
        description: 'TA assignment with partial metadata',
        timestamp: new Date(),
        metadata: {
          userId: 'user-1',
          // Missing courseId and courseName
        },
      },
    ]
    
    renderWithProviders(<ActivityFeed activities={partialMetadataActivities} />)
    
    expect(screen.getByText('User action without metadata')).toBeInTheDocument()
    expect(screen.getByText('TA assignment with partial metadata')).toBeInTheDocument()
  })

  it('should handle real-time updates', () => {
    const { rerender } = renderWithProviders(<ActivityFeed activities={mockActivities.slice(0, 2)} />)
    
    expect(screen.getByText('New user registered: John Doe')).toBeInTheDocument()
    expect(screen.queryByText('Invitation sent to jane@example.com')).not.toBeInTheDocument()
    
    // Simulate real-time update
    rerender(<ActivityFeed activities={mockActivities.slice(0, 3)} />)
    
    expect(screen.getByText('New user registered: John Doe')).toBeInTheDocument()
    expect(screen.getByText('Invitation sent to jane@example.com')).toBeInTheDocument()
  })

  it('should handle various timestamp edge cases', () => {
    const edgeCaseActivities = [
      {
        id: '1',
        type: 'user' as const,
        description: 'Just now activity',
        timestamp: new Date(), // Now
      },
      {
        id: '2',
        type: 'user' as const,
        description: '59 minutes ago',
        timestamp: new Date(Date.now() - 59 * 60000),
      },
      {
        id: '3',
        type: 'user' as const,
        description: '23 hours ago',
        timestamp: new Date(Date.now() - 23 * 3600000),
      },
      {
        id: '4',
        type: 'user' as const,
        description: '6 days ago',
        timestamp: new Date(Date.now() - 6 * 86400000),
      },
    ]
    
    renderWithProviders(<ActivityFeed activities={edgeCaseActivities} />)
    
    expect(screen.getByText('Just now')).toBeInTheDocument()
    expect(screen.getByText('59m ago')).toBeInTheDocument()
    expect(screen.getByText('23h ago')).toBeInTheDocument()
    expect(screen.getByText('6d ago')).toBeInTheDocument()
  })
})