import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils'
import { CreditsManagement } from '../credits-management'
import type { CreditActionType } from '@prisma/client'

// ===========================================================================
// MOCKS
// ===========================================================================

vi.mock('@/lib/i18n/client', () => ({
  useTranslations: () => ({
    t: (key: string) => key
  })
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: vi.fn()
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
  createMockTransaction({ id: 'tx-2', amount: -1, actionType: 'PUBLICATION', balanceAfter: 14 }),
  createMockTransaction({ id: 'tx-3', amount: 5, actionType: 'ADMIN_GRANT', balanceAfter: 19 })
]

describe('CreditsManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('renders buy credits section', () => {
      render(<CreditsManagement transactions={mockTransactions} />)

      // credits.buy appears in both the heading and button
      expect(screen.getByRole('heading', { name: 'credits.buy' })).toBeInTheDocument()
      expect(screen.getByText('packages.description')).toBeInTheDocument()
    })

    it('renders buy credits button', () => {
      render(<CreditsManagement transactions={mockTransactions} />)

      const buyButtons = screen.getAllByRole('button', { name: /credits.buy/i })
      expect(buyButtons.length).toBeGreaterThan(0)
    })

    it('renders transaction history section', () => {
      render(<CreditsManagement transactions={mockTransactions} />)

      expect(screen.getByText('history.title')).toBeInTheDocument()
      expect(screen.getByText('transactions.description')).toBeInTheDocument()
    })

    it('renders CreditsHistory component with transactions', () => {
      render(<CreditsManagement transactions={mockTransactions} />)

      // Should show table from CreditsHistory
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // USER INTERACTIONS
  // ===========================================================================

  describe('User Interactions', () => {
    it('opens purchase modal when buy button clicked', async () => {
      const { user } = render(<CreditsManagement transactions={mockTransactions} />)

      const buyButtons = screen.getAllByRole('button', { name: /credits.buy/i })
      await user.click(buyButtons[0])

      // Modal should open
      expect(screen.getByText('purchase.title')).toBeInTheDocument()
    })

    it('closes purchase modal on cancel', async () => {
      const { user } = render(<CreditsManagement transactions={mockTransactions} />)

      // Open modal
      const buyButtons = screen.getAllByRole('button', { name: /credits.buy/i })
      await user.click(buyButtons[0])

      expect(screen.getByText('purchase.title')).toBeInTheDocument()

      // Close modal
      await user.click(screen.getByRole('button', { name: 'purchase.cancel' }))

      // Modal should be closed
      expect(screen.queryByText('purchase.title')).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles empty transactions list', () => {
      render(<CreditsManagement transactions={[]} />)

      // Should show empty state from CreditsHistory
      expect(screen.getByText('history.noTransactions')).toBeInTheDocument()
    })

    it('handles single transaction', () => {
      render(<CreditsManagement transactions={[createMockTransaction()]} />)

      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('handles large number of transactions', () => {
      const manyTransactions = Array.from({ length: 50 }, (_, i) =>
        createMockTransaction({ id: `tx-${i}` })
      )

      render(<CreditsManagement transactions={manyTransactions} />)

      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('buy section has proper heading', () => {
      render(<CreditsManagement transactions={mockTransactions} />)

      // Use getByRole to specifically find the heading element
      const heading = screen.getByRole('heading', { name: 'credits.buy' })
      expect(heading.tagName).toBe('H3')
    })

    it('history section has proper title', () => {
      render(<CreditsManagement transactions={mockTransactions} />)

      expect(screen.getByText('history.title')).toBeInTheDocument()
    })

    it('buttons are keyboard accessible', async () => {
      const { user } = render(<CreditsManagement transactions={mockTransactions} />)

      const buyButtons = screen.getAllByRole('button', { name: /credits.buy/i })
      buyButtons[0].focus()

      await user.keyboard('{Enter}')

      expect(screen.getByText('purchase.title')).toBeInTheDocument()
    })
  })
})
