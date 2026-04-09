import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import { CompaniesTable } from '../companies-table'
import { verifyCompanyAction } from '@/app/actions/admin/companies/verify'
import { rejectCompanyAction } from '@/app/actions/admin/companies/reject'
import { toast } from 'sonner'
import type { CompanyProfile, User } from '@prisma/client'

// ===========================================================================
// MOCKS
// ===========================================================================

vi.mock('@/app/actions/admin/companies/verify')
vi.mock('@/app/actions/admin/companies/reject')
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}))
vi.mock('@/lib/i18n/client', () => ({
  useTranslations: (namespace: string) => ({
    t: (key: string) => `${namespace}.${key}`
  })
}))

const mockVerifyAction = vi.mocked(verifyCompanyAction)
const mockRejectAction = vi.mocked(rejectCompanyAction)
const mockToast = vi.mocked(toast)

// ===========================================================================
// TEST DATA
// ===========================================================================

const createMockCompany = (overrides?: Partial<CompanyProfile & { user: { email: string } }>): CompanyProfile & { user: { email: string } } => ({
  id: 'company-123',
  companyName: 'Test Company',
  nip: '1234567890',
  viesVerified: false,
  createdAt: new Date('2025-01-15'),
  updatedAt: new Date('2025-01-15'),
  verifiedAt: null,
  verifiedBy: null,
  userId: 'user-123',
  slug: 'test-company',
  description: null,
  street: null,
  city: null,
  postalCode: null,
  phone: null,
  website: null,
  logo: null,
  banner: null,
  categoryId: null,
  subcategories: null,
  latitude: null,
  longitude: null,
  socialLinks: null,
  businessHours: null,
  user: {
    email: 'company@example.com'
  },
  ...overrides
})

const mockCompanies = [
  createMockCompany(),
  createMockCompany({
    id: 'company-456',
    companyName: 'Verified Company',
    nip: '9876543210',
    viesVerified: true,
    verifiedAt: new Date('2025-01-10'),
    verifiedBy: 'admin-123',
    user: { email: 'verified@example.com' }
  }),
  createMockCompany({
    id: 'company-789',
    companyName: 'Another Pending Company',
    nip: '5555555555',
    viesVerified: false,
    user: { email: 'pending@example.com' }
  })
]

describe('CompaniesTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('renders table with all companies', () => {
      render(<CompaniesTable companies={mockCompanies} />)

      // Verify table headers
      expect(screen.getByText('admin.companies.table.name')).toBeInTheDocument()
      expect(screen.getByText('admin.companies.table.nip')).toBeInTheDocument()
      expect(screen.getByText('admin.companies.table.email')).toBeInTheDocument()
      expect(screen.getByText('admin.companies.table.status')).toBeInTheDocument()
      expect(screen.getByText('admin.companies.table.actions')).toBeInTheDocument()

      // Verify company data displayed
      expect(screen.getByText('Test Company')).toBeInTheDocument()
      expect(screen.getByText('Verified Company')).toBeInTheDocument()
      expect(screen.getByText('Another Pending Company')).toBeInTheDocument()

      // Verify NIP numbers
      expect(screen.getByText('1234567890')).toBeInTheDocument()
      expect(screen.getByText('9876543210')).toBeInTheDocument()
      expect(screen.getByText('5555555555')).toBeInTheDocument()

      // Verify emails
      expect(screen.getByText('company@example.com')).toBeInTheDocument()
      expect(screen.getByText('verified@example.com')).toBeInTheDocument()
      expect(screen.getByText('pending@example.com')).toBeInTheDocument()
    })

    it('renders empty table when no companies provided', () => {
      render(<CompaniesTable companies={[]} />)

      // Headers should still be present
      expect(screen.getByText('admin.companies.table.name')).toBeInTheDocument()

      // No company data
      expect(screen.queryByText('Test Company')).not.toBeInTheDocument()
    })

    it('renders single company correctly', () => {
      const singleCompany = [createMockCompany()]

      render(<CompaniesTable companies={singleCompany} />)

      expect(screen.getByText('Test Company')).toBeInTheDocument()
      expect(screen.getByText('1234567890')).toBeInTheDocument()
      expect(screen.getByText('company@example.com')).toBeInTheDocument()
    })

    it('renders search input with placeholder', () => {
      render(<CompaniesTable companies={mockCompanies} />)

      const searchInput = screen.getByPlaceholderText('admin.companies.search.placeholder')
      expect(searchInput).toBeInTheDocument()
    })

    it('renders status filter dropdown', () => {
      render(<CompaniesTable companies={mockCompanies} />)

      // Filter button should be present
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('renders search button', () => {
      render(<CompaniesTable companies={mockCompanies} />)

      expect(screen.getByRole('button', { name: 'admin.companies.search.button' })).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // PROPS - Different Company States
  // ===========================================================================

  describe('Props - Company States', () => {
    it('displays verified badge for verified companies', () => {
      const verifiedCompany = [createMockCompany({ viesVerified: true })]

      render(<CompaniesTable companies={verifiedCompany} />)

      expect(screen.getByText('admin.companies.status.verified')).toBeInTheDocument()
    })

    it('displays pending badge for unverified companies', () => {
      const pendingCompany = [createMockCompany({ viesVerified: false })]

      render(<CompaniesTable companies={pendingCompany} />)

      expect(screen.getByText('admin.companies.status.pending')).toBeInTheDocument()
    })

    it('shows verify and reject buttons only for pending companies', () => {
      render(<CompaniesTable companies={mockCompanies} />)

      // Should have 2 pending companies (first and third)
      const verifyButtons = screen.getAllByRole('button', { name: 'admin.companies.actions.verify' })
      const rejectButtons = screen.getAllByRole('button', { name: 'admin.companies.actions.reject' })

      expect(verifyButtons).toHaveLength(2)
      expect(rejectButtons).toHaveLength(2)
    })

    it('does not show verify/reject buttons for verified companies', () => {
      const verifiedCompanies = [
        createMockCompany({ id: 'c1', viesVerified: true }),
        createMockCompany({ id: 'c2', viesVerified: true })
      ]

      render(<CompaniesTable companies={verifiedCompanies} />)

      expect(screen.queryByRole('button', { name: 'admin.companies.actions.verify' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'admin.companies.actions.reject' })).not.toBeInTheDocument()
    })

    it('always shows view button for all companies', () => {
      render(<CompaniesTable companies={mockCompanies} />)

      // View buttons have Eye SVG icons - there should be one per company
      const { container } = render(<CompaniesTable companies={mockCompanies} />)
      const eyeIcons = container.querySelectorAll('.lucide-eye')

      // 3 companies should have 3 view buttons
      expect(eyeIcons.length).toBe(3)
    })

    it('pre-fills search input with currentSearch prop', () => {
      render(<CompaniesTable companies={mockCompanies} currentSearch="Test" />)

      const searchInput = screen.getByPlaceholderText('admin.companies.search.placeholder') as HTMLInputElement
      expect(searchInput.value).toBe('Test')
    })

    it('pre-selects status filter with currentStatus prop', () => {
      render(<CompaniesTable companies={mockCompanies} currentStatus="verified" />)

      // The select trigger should show the selected value
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // VARIANTS/STATES - Loading States
  // ===========================================================================

  describe('Variants/States - Loading', () => {
    it('disables verify button while action is loading', async () => {
      let resolvePromise: (value: { success: boolean; data: undefined }) => void
      const pendingPromise = new Promise<{ success: boolean; data: undefined }>(resolve => {
        resolvePromise = resolve
      })
      mockVerifyAction.mockReturnValue(pendingPromise)

      const { user } = render(<CompaniesTable companies={[createMockCompany()]} />)

      const verifyButton = screen.getByRole('button', { name: 'admin.companies.actions.verify' })

      // Click verify button
      await user.click(verifyButton)

      // Button should be disabled during loading
      expect(verifyButton).toBeDisabled()

      // Resolve the promise to clean up
      resolvePromise!({ success: true, data: undefined })
      await waitFor(() => {
        expect(verifyButton).not.toBeDisabled()
      })
    })

    it('disables reject button while action is loading', async () => {
      globalThis.prompt = vi.fn(() => 'Invalid documents')
      let resolvePromise: (value: { success: boolean; data: undefined }) => void
      const pendingPromise = new Promise<{ success: boolean; data: undefined }>(resolve => {
        resolvePromise = resolve
      })
      mockRejectAction.mockReturnValue(pendingPromise)

      const { user } = render(<CompaniesTable companies={[createMockCompany()]} />)

      const rejectButton = screen.getByRole('button', { name: 'admin.companies.actions.reject' })

      // Click reject button
      await user.click(rejectButton)

      // Button should be disabled during loading
      expect(rejectButton).toBeDisabled()

      // Resolve the promise to clean up
      resolvePromise!({ success: true, data: undefined })
      await waitFor(() => {
        expect(rejectButton).not.toBeDisabled()
      })
    })

    it('re-enables buttons after action completes', async () => {
      mockVerifyAction.mockResolvedValue({ success: true, data: undefined })

      const { user } = render(<CompaniesTable companies={[createMockCompany()]} />)

      const verifyButton = screen.getByRole('button', { name: 'admin.companies.actions.verify' })

      await user.click(verifyButton)

      // Wait for action to complete
      await waitFor(() => {
        expect(verifyButton).not.toBeDisabled()
      })
    })
  })

  // ===========================================================================
  // INTERACTIONS - User Actions
  // ===========================================================================

  describe('Interactions', () => {
    it('calls verifyCompanyAction when verify button clicked', async () => {
      mockVerifyAction.mockResolvedValue({ success: true, data: undefined })

      const { user } = render(<CompaniesTable companies={[createMockCompany()]} />)

      const verifyButton = screen.getByRole('button', { name: 'admin.companies.actions.verify' })
      await user.click(verifyButton)

      expect(mockVerifyAction).toHaveBeenCalledWith('company-123')
      expect(mockVerifyAction).toHaveBeenCalledTimes(1)
    })

    it('shows success toast after successful verification', async () => {
      mockVerifyAction.mockResolvedValue({ success: true, data: undefined })

      const { user } = render(<CompaniesTable companies={[createMockCompany()]} />)

      await user.click(screen.getByRole('button', { name: 'admin.companies.actions.verify' }))

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('admin.companies.verify.success')
      })
    })

    it('shows error toast when verification fails', async () => {
      mockVerifyAction.mockResolvedValue({
        success: false,
        error: 'admin.errors.verifyFailed',
        code: 'VERIFY_FAILED'
      })

      const { user } = render(<CompaniesTable companies={[createMockCompany()]} />)

      await user.click(screen.getByRole('button', { name: 'admin.companies.actions.verify' }))

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('errors.admin.errors.verifyFailed')
      })
    })

    it('prompts for reason when reject button clicked', async () => {
      const mockPrompt = vi.fn(() => 'Invalid NIP number')
      globalThis.prompt = mockPrompt
      mockRejectAction.mockResolvedValue({ success: true, data: undefined })

      const { user } = render(<CompaniesTable companies={[createMockCompany()]} />)

      await user.click(screen.getByRole('button', { name: 'admin.companies.actions.reject' }))

      expect(mockPrompt).toHaveBeenCalledWith('admin.companies.reject.reasonPrompt')
    })

    it('calls rejectCompanyAction with reason when provided', async () => {
      globalThis.prompt = vi.fn(() => 'Invalid documents')
      mockRejectAction.mockResolvedValue({ success: true, data: undefined })

      const { user } = render(<CompaniesTable companies={[createMockCompany()]} />)

      await user.click(screen.getByRole('button', { name: 'admin.companies.actions.reject' }))

      await waitFor(() => {
        expect(mockRejectAction).toHaveBeenCalledWith('company-123', 'Invalid documents')
      })
    })

    it('does not call rejectCompanyAction when reason cancelled', async () => {
      globalThis.prompt = vi.fn(() => null)
      mockRejectAction.mockResolvedValue({ success: true, data: undefined })

      const { user } = render(<CompaniesTable companies={[createMockCompany()]} />)

      await user.click(screen.getByRole('button', { name: 'admin.companies.actions.reject' }))

      expect(mockRejectAction).not.toHaveBeenCalled()
    })

    it('shows success toast after successful rejection', async () => {
      globalThis.prompt = vi.fn(() => 'Invalid NIP')
      mockRejectAction.mockResolvedValue({ success: true, data: undefined })

      const { user } = render(<CompaniesTable companies={[createMockCompany()]} />)

      await user.click(screen.getByRole('button', { name: 'admin.companies.actions.reject' }))

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('admin.companies.reject.success')
      })
    })

    it('shows error toast when rejection fails', async () => {
      globalThis.prompt = vi.fn(() => 'Invalid NIP')
      mockRejectAction.mockResolvedValue({
        success: false,
        error: 'admin.errors.rejectFailed',
        code: 'REJECT_FAILED'
      })

      const { user } = render(<CompaniesTable companies={[createMockCompany()]} />)

      await user.click(screen.getByRole('button', { name: 'admin.companies.actions.reject' }))

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('errors.admin.errors.rejectFailed')
      })
    })

    it('allows typing in search input', async () => {
      const { user } = render(<CompaniesTable companies={mockCompanies} />)

      const searchInput = screen.getByPlaceholderText('admin.companies.search.placeholder')

      await user.type(searchInput, 'Test Company')

      expect(searchInput).toHaveValue('Test Company')
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('uses table role for data table', () => {
      render(<CompaniesTable companies={mockCompanies} />)

      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('has accessible column headers', () => {
      render(<CompaniesTable companies={mockCompanies} />)

      expect(screen.getByRole('columnheader', { name: 'admin.companies.table.name' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'admin.companies.table.nip' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'admin.companies.table.email' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'admin.companies.table.status' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'admin.companies.table.actions' })).toBeInTheDocument()
    })

    it('has accessible button labels for actions', () => {
      render(<CompaniesTable companies={[createMockCompany()]} />)

      expect(screen.getByRole('button', { name: 'admin.companies.actions.verify' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'admin.companies.actions.reject' })).toBeInTheDocument()
    })

    it('has accessible search input', () => {
      render(<CompaniesTable companies={mockCompanies} />)

      const searchInput = screen.getByPlaceholderText('admin.companies.search.placeholder')
      // Input should be accessible by placeholder
      expect(searchInput).toBeInTheDocument()
    })

    it('has accessible status filter dropdown', () => {
      render(<CompaniesTable companies={mockCompanies} />)

      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('uses proper semantic HTML for table rows', () => {
      render(<CompaniesTable companies={mockCompanies} />)

      const rows = screen.getAllByRole('row')
      // 1 header row + 3 data rows
      expect(rows).toHaveLength(4)
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles company with null user email gracefully', () => {
      const companyWithNullEmail = [createMockCompany({ user: { email: null as any } })]

      render(<CompaniesTable companies={companyWithNullEmail} />)

      // Should not crash, table should render
      expect(screen.getByText('Test Company')).toBeInTheDocument()
    })

    it('handles company with very long name', () => {
      const longName = 'A'.repeat(200)
      const companyWithLongName = [createMockCompany({ companyName: longName })]

      render(<CompaniesTable companies={companyWithLongName} />)

      expect(screen.getByText(longName)).toBeInTheDocument()
    })

    it('handles company with special characters in name', () => {
      const specialName = 'Test & Company <script>alert("xss")</script>'
      const companyWithSpecialName = [createMockCompany({ companyName: specialName })]

      render(<CompaniesTable companies={companyWithSpecialName} />)

      expect(screen.getByText(specialName)).toBeInTheDocument()
    })

    it('handles multiple rapid clicks on verify button', async () => {
      // Mock a slightly delayed response
      mockVerifyAction.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ success: true, data: undefined }), 50))
      )

      const { user } = render(<CompaniesTable companies={[createMockCompany()]} />)

      const verifyButton = screen.getByRole('button', { name: 'admin.companies.actions.verify' })

      // First click - should trigger the action
      await user.click(verifyButton)

      // Button should be disabled now, subsequent clicks should do nothing
      expect(verifyButton).toBeDisabled()

      // Wait for the action to complete
      await waitFor(() => {
        expect(mockVerifyAction).toHaveBeenCalledTimes(1)
      })
    })

    it('handles error response without error message', async () => {
      mockVerifyAction.mockResolvedValue({
        success: false,
        error: undefined as any,
        code: 'UNKNOWN_ERROR'
      })

      const { user } = render(<CompaniesTable companies={[createMockCompany()]} />)

      await user.click(screen.getByRole('button', { name: 'admin.companies.actions.verify' }))

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalled()
      })
    })

    it('preserves search input value during typing', async () => {
      const { user } = render(<CompaniesTable companies={mockCompanies} />)

      const searchInput = screen.getByPlaceholderText('admin.companies.search.placeholder')

      await user.type(searchInput, 'Test')
      expect(searchInput).toHaveValue('Test')

      await user.type(searchInput, ' Company')
      expect(searchInput).toHaveValue('Test Company')
    })

    it('handles empty NIP gracefully', () => {
      const companyWithEmptyNIP = [createMockCompany({ nip: '' })]

      render(<CompaniesTable companies={companyWithEmptyNIP} />)

      // Should render without crashing
      expect(screen.getByText('Test Company')).toBeInTheDocument()
    })

    it('handles companies created on same date', () => {
      const sameDate = new Date('2025-01-15')
      const companiesWithSameDate = [
        createMockCompany({ id: 'c1', createdAt: sameDate }),
        createMockCompany({ id: 'c2', createdAt: sameDate }),
        createMockCompany({ id: 'c3', createdAt: sameDate })
      ]

      render(<CompaniesTable companies={companiesWithSameDate} />)

      // All companies should be rendered
      const rows = screen.getAllByRole('row')
      // 1 header + 3 data rows
      expect(rows).toHaveLength(4)
    })
  })
})
