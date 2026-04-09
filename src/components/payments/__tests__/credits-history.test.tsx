import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils'
import { CreditsHistory } from '../credits-history'
import type { CreditActionType } from '@prisma/client'

// ===========================================================================
// MOCKS
// ===========================================================================

vi.mock('@/lib/i18n/client', () => ({
  useTranslations: () => ({
    t: (key: string) => key
  })
}))

// ===========================================================================
// TEST DATA
// ===========================================================================

interface Transaction {
  id: string
  amount: number
  actionType: CreditActionType
  createdAt: Date
  balanceAfter: number
  short: {
    id: string
    title: string
  } | null
}

const createMockTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'tx-1',
  amount: 5,
  actionType: 'ADMIN_GRANT',
  createdAt: new Date('2025-01-15T10:30:00'),
  balanceAfter: 10,
  short: null,
  ...overrides
})

const mockTransactions: Transaction[] = [
  createMockTransaction({ id: 'tx-1', amount: 10, actionType: 'ADMIN_GRANT', balanceAfter: 15 }),
  createMockTransaction({ id: 'tx-2', amount: -1, actionType: 'PUBLICATION', balanceAfter: 14, short: { id: 'short-1', title: 'Published Short' } }),
  createMockTransaction({ id: 'tx-3', amount: 5, actionType: 'ADMIN_GRANT', balanceAfter: 19 }),
  createMockTransaction({ id: 'tx-4', amount: 2, actionType: 'PROMO_EXPIRED', balanceAfter: 21 }),
  createMockTransaction({ id: 'tx-5', amount: 1, actionType: 'REFUND', balanceAfter: 22 }),
  createMockTransaction({ id: 'tx-6', amount: 3, actionType: 'ADMIN_GRANT', balanceAfter: 25 })
]

describe('CreditsHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('renders table with column headers', () => {
      render(<CreditsHistory transactions={mockTransactions} />)

      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getByText('history.date')).toBeInTheDocument()
      expect(screen.getByText('history.type')).toBeInTheDocument()
      expect(screen.getByText('history.amount')).toBeInTheDocument()
      expect(screen.getByText('history.balance')).toBeInTheDocument()
      expect(screen.getByText('history.relatedShort')).toBeInTheDocument()
    })

    it('renders all transactions', () => {
      render(<CreditsHistory transactions={mockTransactions} />)

      const rows = screen.getAllByRole('row')
      // Header + 6 data rows
      expect(rows.length).toBe(7)
    })

    it('displays transaction amounts', () => {
      render(<CreditsHistory transactions={mockTransactions} />)

      expect(screen.getByText('+10')).toBeInTheDocument()
      expect(screen.getByText('-1')).toBeInTheDocument()
    })

    it('displays balance after transaction', () => {
      render(<CreditsHistory transactions={mockTransactions} />)

      expect(screen.getByText('15')).toBeInTheDocument()
      expect(screen.getByText('14')).toBeInTheDocument()
    })

    it('displays action types with translation keys', () => {
      render(<CreditsHistory transactions={mockTransactions} />)

      expect(screen.getAllByText('transactions.actionType.ADMIN_GRANT').length).toBeGreaterThan(0)
      expect(screen.getByText('transactions.actionType.PUBLICATION')).toBeInTheDocument()
      expect(screen.getByText('transactions.actionType.PROMO_EXPIRED')).toBeInTheDocument()
    })

    it('displays related short title when available', () => {
      render(<CreditsHistory transactions={mockTransactions} />)

      expect(screen.getByText('Published Short')).toBeInTheDocument()
    })

    it('displays dash when no related short', () => {
      render(<CreditsHistory transactions={mockTransactions} />)

      // Multiple transactions without short should show dash
      const dashes = screen.getAllByText('-')
      expect(dashes.length).toBeGreaterThan(0)
    })
  })

  // ===========================================================================
  // EMPTY STATE
  // ===========================================================================

  describe('Empty State', () => {
    it('renders empty state when no transactions', () => {
      render(<CreditsHistory transactions={[]} />)

      expect(screen.getByText('history.noTransactions')).toBeInTheDocument()
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // ACTION TYPES
  // ===========================================================================

  describe('Action Types', () => {
    it('displays ADMIN_GRANT action type correctly', () => {
      render(<CreditsHistory transactions={[createMockTransaction({ actionType: 'ADMIN_GRANT' })]} />)

      expect(screen.getByText('transactions.actionType.ADMIN_GRANT')).toBeInTheDocument()
    })

    it('displays PROMO_EXPIRED action type correctly', () => {
      render(<CreditsHistory transactions={[createMockTransaction({ actionType: 'PROMO_EXPIRED' })]} />)

      expect(screen.getByText('transactions.actionType.PROMO_EXPIRED')).toBeInTheDocument()
    })

    it('displays REFUND action type correctly', () => {
      render(<CreditsHistory transactions={[createMockTransaction({ actionType: 'REFUND' })]} />)

      expect(screen.getByText('transactions.actionType.REFUND')).toBeInTheDocument()
    })

    it('displays PUBLICATION action type correctly', () => {
      render(<CreditsHistory transactions={[createMockTransaction({ actionType: 'PUBLICATION' })]} />)

      expect(screen.getByText('transactions.actionType.PUBLICATION')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // AMOUNT FORMATTING
  // ===========================================================================

  describe('Amount Formatting', () => {
    it('shows positive amounts with + prefix in green', () => {
      render(<CreditsHistory transactions={[createMockTransaction({ amount: 5 })]} />)

      const amountCell = screen.getByText('+5')
      expect(amountCell).toHaveClass('text-green-600')
    })

    it('shows negative amounts without + prefix in red', () => {
      render(<CreditsHistory transactions={[createMockTransaction({ amount: -2 })]} />)

      const amountCell = screen.getByText('-2')
      expect(amountCell).toHaveClass('text-red-600')
    })

    it('correctly colors source icon background for positive amounts', () => {
      const { container } = render(<CreditsHistory transactions={[createMockTransaction({ amount: 5 })]} />)

      const iconContainer = container.querySelector('.bg-green-100')
      expect(iconContainer).toBeInTheDocument()
    })

    it('correctly colors source icon background for negative amounts', () => {
      const { container } = render(<CreditsHistory transactions={[createMockTransaction({ amount: -1 })]} />)

      const iconContainer = container.querySelector('.bg-red-100')
      expect(iconContainer).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles zero amount', () => {
      render(<CreditsHistory transactions={[createMockTransaction({ amount: 0 })]} />)

      // Zero is positive (> 0 is false)
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('handles large amounts', () => {
      render(<CreditsHistory transactions={[createMockTransaction({ amount: 1000 })]} />)

      expect(screen.getByText('+1000')).toBeInTheDocument()
    })

    it('handles long short titles', () => {
      render(
        <CreditsHistory
          transactions={[
            createMockTransaction({
              short: { id: 's-1', title: 'This is a very long title that might overflow the container' }
            })
          ]}
        />
      )

      expect(screen.getByText('This is a very long title that might overflow the container')).toBeInTheDocument()
    })

    it('handles recent dates', () => {
      render(
        <CreditsHistory
          transactions={[createMockTransaction({ createdAt: new Date() })]}
        />
      )

      // Should render without error
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('has accessible table structure', () => {
      render(<CreditsHistory transactions={mockTransactions} />)

      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getAllByRole('row').length).toBeGreaterThan(0)
      expect(screen.getAllByRole('columnheader').length).toBe(5)
    })

    it('table cells have correct role', () => {
      render(<CreditsHistory transactions={mockTransactions} />)

      expect(screen.getAllByRole('cell').length).toBeGreaterThan(0)
    })
  })
})
