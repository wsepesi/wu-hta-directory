import React from 'react'
import { screen, waitFor } from '@testing-library/react'
import UserGrowthChart from '@/components/admin/UserGrowthChart'
import { renderWithProviders, mockFetch } from '../utils/test-helpers'

// Mock the SimpleLineChart component
jest.mock('@/components/charts/SimpleLineChart', () => ({
  SimpleLineChart: ({ data, color, height, className }: any) => (
    <div 
      data-testid="simple-line-chart" 
      data-color={color}
      data-height={height}
      className={className}
    >
      {data.map((point: any, index: number) => (
        <div key={index} data-testid={`chart-point-${index}`}>
          {point.label}: {point.value}
        </div>
      ))}
    </div>
  ),
}))

global.fetch = jest.fn()

describe('UserGrowthChart Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockChartData = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June'],
    datasets: [
      {
        label: 'New Users',
        data: [12, 25, 18, 32, 28, 45],
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
      },
    ],
  }

  it('should display loading spinner initially', () => {
    global.fetch = mockFetch(mockChartData)
    renderWithProviders(<UserGrowthChart />)
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('should fetch and display chart data correctly', async () => {
    global.fetch = mockFetch(mockChartData)
    renderWithProviders(<UserGrowthChart />)

    await waitFor(() => {
      expect(screen.getByText('User Growth Over Time')).toBeInTheDocument()
      expect(screen.getByText('Last 6 months')).toBeInTheDocument()
      expect(screen.getByTestId('simple-line-chart')).toBeInTheDocument()
    })

    // Check chart data points
    expect(screen.getByText('Jan: 12')).toBeInTheDocument()
    expect(screen.getByText('Feb: 25')).toBeInTheDocument()
    expect(screen.getByText('Mar: 18')).toBeInTheDocument()
    expect(screen.getByText('Apr: 32')).toBeInTheDocument()
    expect(screen.getByText('May: 28')).toBeInTheDocument()
    expect(screen.getByText('Jun: 45')).toBeInTheDocument()
  })

  it('should calculate and display total and average correctly', async () => {
    global.fetch = mockFetch(mockChartData)
    renderWithProviders(<UserGrowthChart />)

    await waitFor(() => {
      // Total: 12 + 25 + 18 + 32 + 28 + 45 = 160
      expect(screen.getByText('160')).toBeInTheDocument()
      expect(screen.getByText('Total New Users')).toBeInTheDocument()
      
      // Average: 160 / 6 = 26.67, rounded to 27
      expect(screen.getByText('27')).toBeInTheDocument()
      expect(screen.getByText('Avg. per Month')).toBeInTheDocument()
    })
  })

  it('should handle fetch errors gracefully', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))
    renderWithProviders(<UserGrowthChart />)

    await waitFor(() => {
      expect(screen.getByText('User Growth')).toBeInTheDocument()
      expect(screen.getByText('Failed to load chart data')).toBeInTheDocument()
    })
  })

  it('should handle non-ok responses', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    })
    renderWithProviders(<UserGrowthChart />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load chart data')).toBeInTheDocument()
    })
  })

  it('should pass correct props to SimpleLineChart', async () => {
    global.fetch = mockFetch(mockChartData)
    renderWithProviders(<UserGrowthChart />)

    await waitFor(() => {
      const chart = screen.getByTestId('simple-line-chart')
      expect(chart).toHaveAttribute('data-color', 'rgb(99, 102, 241)')
      expect(chart).toHaveAttribute('data-height', '200')
      expect(chart).toHaveClass('mb-4')
    })
  })

  it('should handle empty data correctly', async () => {
    const emptyData = {
      labels: [],
      datasets: [
        {
          label: 'New Users',
          data: [],
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
        },
      ],
    }
    global.fetch = mockFetch(emptyData)
    renderWithProviders(<UserGrowthChart />)

    await waitFor(() => {
      expect(screen.getByText('Total New Users')).toBeInTheDocument()
      expect(screen.getByText('0')).toBeInTheDocument() // Total should be 0
      expect(screen.getByText('Avg. per Month')).toBeInTheDocument()
    })
  })

  it('should handle large numbers correctly', async () => {
    const largeDataChart = {
      labels: ['January', 'February', 'March'],
      datasets: [
        {
          label: 'New Users',
          data: [1000, 2500, 3500],
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
        },
      ],
    }
    global.fetch = mockFetch(largeDataChart)
    renderWithProviders(<UserGrowthChart />)

    await waitFor(() => {
      // Total: 1000 + 2500 + 3500 = 7000
      expect(screen.getByText('7000')).toBeInTheDocument()
      // Average: 7000 / 3 = 2333.33, rounded to 2333
      expect(screen.getByText('2333')).toBeInTheDocument()
    })
  })

  it('should abbreviate month names correctly', async () => {
    const fullMonthData = {
      labels: ['September', 'October', 'November', 'December'],
      datasets: [
        {
          label: 'New Users',
          data: [10, 20, 30, 40],
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
        },
      ],
    }
    global.fetch = mockFetch(fullMonthData)
    renderWithProviders(<UserGrowthChart />)

    await waitFor(() => {
      expect(screen.getByText('Sep: 10')).toBeInTheDocument()
      expect(screen.getByText('Oct: 20')).toBeInTheDocument()
      expect(screen.getByText('Nov: 30')).toBeInTheDocument()
      expect(screen.getByText('Dec: 40')).toBeInTheDocument()
    })
  })

  it('should handle multiple datasets correctly', async () => {
    const multiDatasetChart = {
      labels: ['January', 'February'],
      datasets: [
        {
          label: 'New Users',
          data: [10, 20],
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
        },
        {
          label: 'Active Users',
          data: [50, 60],
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
        },
      ],
    }
    global.fetch = mockFetch(multiDatasetChart)
    renderWithProviders(<UserGrowthChart />)

    await waitFor(() => {
      // Should only use first dataset
      expect(screen.getByText('Jan: 10')).toBeInTheDocument()
      expect(screen.getByText('Feb: 20')).toBeInTheDocument()
      // Total should be from first dataset only
      expect(screen.getByText('30')).toBeInTheDocument()
    })
  })
})