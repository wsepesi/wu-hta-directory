import React from 'react'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EnhancedUserManagement from '@/components/admin/EnhancedUserManagement'
import { renderWithProviders, mockFetch, mockUsers } from '../utils/test-helpers'

// Mock the useUsers hook
jest.mock('@/hooks/useUsers', () => ({
  useUsers: jest.fn(),
}))

// Mock the audit logger
jest.mock('@/lib/audit-logger', () => ({
  logAuditEvent: jest.fn(),
}))

import { useUsers } from '@/hooks/useUsers'

global.fetch = jest.fn()
const mockConfirm = jest.fn()
global.confirm = mockConfirm

describe('EnhancedUserManagement Component', () => {
  const mockUseUsers = useUsers as jest.MockedFunction<typeof useUsers>
  const mockRefetch = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockConfirm.mockReturnValue(true)
    mockUseUsers.mockReturnValue({
      users: mockUsers,
      loading: false,
      error: null,
      refetch: mockRefetch,
    })
  })

  it('should render user list correctly', async () => {
    renderWithProviders(<EnhancedUserManagement />)

    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument()
      expect(screen.getByText('admin@test.com')).toBeInTheDocument()
      expect(screen.getByText('TA User')).toBeInTheDocument()
      expect(screen.getByText('ta@test.com')).toBeInTheDocument()
      expect(screen.getByText('Regular User')).toBeInTheDocument()
      expect(screen.getByText('user@test.com')).toBeInTheDocument()
    })
  })

  it('should display loading state', () => {
    mockUseUsers.mockReturnValue({
      users: [],
      loading: true,
      error: null,
      refetch: mockRefetch,
    })

    renderWithProviders(<EnhancedUserManagement />)
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('should display error state', () => {
    mockUseUsers.mockReturnValue({
      users: [],
      loading: false,
      error: new Error('Failed to fetch'),
      refetch: mockRefetch,
    })

    renderWithProviders(<EnhancedUserManagement />)
    expect(screen.getByText('Failed to load users')).toBeInTheDocument()
  })

  it('should filter users by search query', async () => {
    renderWithProviders(<EnhancedUserManagement />)
    
    const searchInput = screen.getByPlaceholderText('Search users...')
    await userEvent.type(searchInput, 'admin')

    expect(screen.getByText('Admin User')).toBeInTheDocument()
    expect(screen.queryByText('TA User')).not.toBeInTheDocument()
    expect(screen.queryByText('Regular User')).not.toBeInTheDocument()
  })

  it('should filter users by role', async () => {
    renderWithProviders(<EnhancedUserManagement />)
    
    const roleFilter = screen.getByRole('combobox', { name: /all roles/i })
    await userEvent.selectOptions(roleFilter, 'admin')

    expect(screen.getByText('Admin User')).toBeInTheDocument()
    expect(screen.queryByText('TA User')).not.toBeInTheDocument()
    expect(screen.queryByText('Regular User')).not.toBeInTheDocument()
  })

  it('should handle role changes', async () => {
    global.fetch = mockFetch({ success: true })
    renderWithProviders(<EnhancedUserManagement />)

    const roleSelects = screen.getAllByRole('combobox')
    // Skip the filter select (index 1), get the first user role select
    const firstUserRoleSelect = roleSelects[2]
    
    await userEvent.selectOptions(firstUserRoleSelect, 'head_ta')

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/users/1/toggle-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'head_ta' }),
      })
      expect(mockRefetch).toHaveBeenCalled()
    })
  })

  it('should handle user deletion with confirmation', async () => {
    global.fetch = mockFetch({ success: true })
    renderWithProviders(<EnhancedUserManagement />)

    const deleteButtons = screen.getAllByText('Delete')
    fireEvent.click(deleteButtons[0])

    expect(mockConfirm).toHaveBeenCalledWith(
      'Are you sure you want to delete this user? This action cannot be undone.'
    )

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/users/1', {
        method: 'DELETE',
      })
      expect(mockRefetch).toHaveBeenCalled()
    })
  })

  it('should cancel deletion when user denies confirmation', async () => {
    mockConfirm.mockReturnValue(false)
    renderWithProviders(<EnhancedUserManagement />)

    const deleteButtons = screen.getAllByText('Delete')
    fireEvent.click(deleteButtons[0])

    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('should handle select all functionality', async () => {
    renderWithProviders(<EnhancedUserManagement />)

    const selectAllCheckbox = screen.getAllByRole('checkbox')[0]
    fireEvent.click(selectAllCheckbox)

    const checkboxes = screen.getAllByRole('checkbox')
    // First is select all, rest should be individual user checkboxes
    for (let i = 1; i < checkboxes.length; i++) {
      expect(checkboxes[i]).toBeChecked()
    }

    // Deselect all
    fireEvent.click(selectAllCheckbox)
    for (let i = 1; i < checkboxes.length; i++) {
      expect(checkboxes[i]).not.toBeChecked()
    }
  })

  it('should show bulk actions when users are selected', async () => {
    renderWithProviders(<EnhancedUserManagement />)

    // Select first user
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[1])

    expect(screen.getByText('Bulk Actions')).toBeInTheDocument()
    expect(screen.getByText('Apply to 1 users')).toBeInTheDocument()
  })

  it('should handle bulk activate action', async () => {
    global.fetch = mockFetch({ success: true })
    renderWithProviders(<EnhancedUserManagement />)

    // Select all users
    const selectAllCheckbox = screen.getAllByRole('checkbox')[0]
    fireEvent.click(selectAllCheckbox)

    // Select bulk action
    const bulkActionSelect = screen.getByText('Bulk Actions').closest('select')!
    await userEvent.selectOptions(bulkActionSelect, 'activate')

    // Apply action
    const applyButton = screen.getByText(/Apply to \d+ users/)
    fireEvent.click(applyButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(3) // For 3 users
      expect(mockRefetch).toHaveBeenCalled()
    })
  })

  it('should handle bulk delete action', async () => {
    global.fetch = mockFetch({ success: true })
    renderWithProviders(<EnhancedUserManagement />)

    // Select first user
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[1])

    // Select bulk delete
    const bulkActionSelect = screen.getByText('Bulk Actions').closest('select')!
    await userEvent.selectOptions(bulkActionSelect, 'delete')

    // Apply action
    const applyButton = screen.getByText('Apply to 1 users')
    fireEvent.click(applyButton)

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled()
      expect(global.fetch).toHaveBeenCalledWith('/api/users/1', {
        method: 'DELETE',
      })
    })
  })

  it('should disable apply button when processing', async () => {
    global.fetch = jest.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100))
    )
    renderWithProviders(<EnhancedUserManagement />)

    // Select user and action
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[1])
    
    const bulkActionSelect = screen.getByText('Bulk Actions').closest('select')!
    await userEvent.selectOptions(bulkActionSelect, 'activate')

    const applyButton = screen.getByText('Apply to 1 users')
    fireEvent.click(applyButton)

    expect(screen.getByText('Processing...')).toBeInTheDocument()
    expect(applyButton).toBeDisabled()
  })

  it('should show empty state when no users match criteria', async () => {
    renderWithProviders(<EnhancedUserManagement />)
    
    const searchInput = screen.getByPlaceholderText('Search users...')
    await userEvent.type(searchInput, 'nonexistentuser')

    expect(screen.getByText('No users found matching your criteria.')).toBeInTheDocument()
  })

  it('should format dates correctly', () => {
    renderWithProviders(<EnhancedUserManagement />)
    
    // Check that dates are formatted
    const datePattern = /\d{1,2}\/\d{1,2}\/\d{4}/
    const dateElements = screen.getAllByText(datePattern)
    expect(dateElements.length).toBeGreaterThan(0)
  })

  it('should handle graduation year display', () => {
    const usersWithGradYear = [
      { ...mockUsers[0], gradYear: 2024 },
      { ...mockUsers[1], gradYear: null },
    ]
    
    mockUseUsers.mockReturnValue({
      users: usersWithGradYear,
      loading: false,
      error: null,
      refetch: mockRefetch,
    })

    renderWithProviders(<EnhancedUserManagement />)
    
    expect(screen.getByText('2024')).toBeInTheDocument()
    expect(screen.getByText('N/A')).toBeInTheDocument()
  })

  it('should handle API errors gracefully', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('API Error'))
    const consoleError = jest.spyOn(console, 'error').mockImplementation()

    renderWithProviders(<EnhancedUserManagement />)

    const deleteButtons = screen.getAllByText('Delete')
    fireEvent.click(deleteButtons[0])

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Error deleting user:', expect.any(Error))
    })

    consoleError.mockRestore()
  })
})