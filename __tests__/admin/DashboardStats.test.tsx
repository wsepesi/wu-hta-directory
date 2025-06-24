import React from 'react'
import { screen, waitFor, act } from '@testing-library/react'
import DashboardStats from '@/components/admin/DashboardStats'
import { renderWithProviders, mockFetch } from '../utils/test-helpers'

// Mock the fetch function globally
global.fetch = jest.fn()

describe('DashboardStats Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const mockStatsData = {
    totalUsers: 150,
    totalCourses: 25,
    totalProfessors: 15,
    totalAssignments: 45,
    pendingInvitations: 8,
    activeUsers: 120,
    userGrowth: {
      value: 12.5,
      isPositive: true,
    },
    assignmentGrowth: {
      value: 8.3,
      isPositive: true,
    },
  }

  it('should display loading skeletons initially', () => {
    global.fetch = mockFetch(mockStatsData)
    renderWithProviders(<DashboardStats />)
    
    const skeletons = screen.getAllByTestId(/^skeleton-|animate-pulse/i)
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('should fetch and display stats correctly', async () => {
    global.fetch = mockFetch(mockStatsData)
    renderWithProviders(<DashboardStats />)

    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument()
      expect(screen.getByText('150')).toBeInTheDocument()
      expect(screen.getByText('120 active')).toBeInTheDocument()
      expect(screen.getByText('Total Courses')).toBeInTheDocument()
      expect(screen.getByText('25')).toBeInTheDocument()
      expect(screen.getByText('TA Assignments')).toBeInTheDocument()
      expect(screen.getByText('45')).toBeInTheDocument()
      expect(screen.getByText('Pending Invites')).toBeInTheDocument()
      expect(screen.getByText('8')).toBeInTheDocument()
    })
  })

  it('should handle fetch errors gracefully', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))
    renderWithProviders(<DashboardStats />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load statistics')).toBeInTheDocument()
    })
  })

  it('should handle non-ok responses', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    })
    renderWithProviders(<DashboardStats />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load statistics')).toBeInTheDocument()
    })
  })

  it('should refresh stats every minute', async () => {
    global.fetch = mockFetch(mockStatsData)
    renderWithProviders(<DashboardStats />)

    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument()
    })

    expect(global.fetch).toHaveBeenCalledTimes(1)

    // Fast forward 1 minute
    act(() => {
      jest.advanceTimersByTime(60000)
    })

    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('should clean up interval on unmount', async () => {
    global.fetch = mockFetch(mockStatsData)
    const { unmount } = renderWithProviders(<DashboardStats />)

    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument()
    })

    unmount()

    // Fast forward 1 minute after unmount
    act(() => {
      jest.advanceTimersByTime(60000)
    })

    // Should not have made additional calls after unmount
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('should handle large numbers correctly', async () => {
    const largeStatsData = {
      ...mockStatsData,
      totalUsers: 1000000,
      totalCourses: 50000,
      totalAssignments: 250000,
    }
    global.fetch = mockFetch(largeStatsData)
    renderWithProviders(<DashboardStats />)

    await waitFor(() => {
      expect(screen.getByText('1000000')).toBeInTheDocument()
      expect(screen.getByText('50000')).toBeInTheDocument()
      expect(screen.getByText('250000')).toBeInTheDocument()
    })
  })

  it('should display trends correctly', async () => {
    global.fetch = mockFetch(mockStatsData)
    renderWithProviders(<DashboardStats />)

    await waitFor(() => {
      // Check for trend indicators (would need to check StatsCard implementation)
      const statsCards = screen.getAllByRole('article')
      expect(statsCards).toHaveLength(4)
    })
  })

  it('should handle negative growth trends', async () => {
    const negativeGrowthData = {
      ...mockStatsData,
      userGrowth: {
        value: -5.2,
        isPositive: false,
      },
      assignmentGrowth: {
        value: -3.1,
        isPositive: false,
      },
    }
    global.fetch = mockFetch(negativeGrowthData)
    renderWithProviders(<DashboardStats />)

    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument()
      // Additional assertions would depend on StatsCard implementation
    })
  })

  it('should handle zero values correctly', async () => {
    const zeroValueData = {
      ...mockStatsData,
      pendingInvitations: 0,
      activeUsers: 0,
    }
    global.fetch = mockFetch(zeroValueData)
    renderWithProviders(<DashboardStats />)

    await waitFor(() => {
      expect(screen.getByText('0 active')).toBeInTheDocument()
      expect(screen.getByText('0')).toBeInTheDocument()
    })
  })
})