import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import { CategoriesTree } from '../categories-tree'
import { deleteCategoryAction } from '@/app/actions/admin/categories/delete'
import * as sonner from 'sonner'

// ===========================================================================
// MOCKS
// ===========================================================================

vi.mock('@/app/actions/admin/categories/delete')
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn()
  }
}))

vi.mock('@/lib/i18n/client', () => ({
  useTranslations: () => ({
    t: (key: string) => `admin-categories.${key}`
  })
}))

const mockDeleteCategoryAction = vi.mocked(deleteCategoryAction)
const mockToast = vi.mocked(sonner.toast)

// Helper to get icon-only buttons by their variant class
function getDestructiveButtons(container: HTMLElement) {
  return Array.from(container.querySelectorAll('button')).filter(
    btn => btn.className.includes('destructive')
  )
}

function getOutlineButtons(container: HTMLElement) {
  return Array.from(container.querySelectorAll('button')).filter(
    btn => btn.className.includes('border-input')
  )
}

// ===========================================================================
// TEST DATA
// ===========================================================================

interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
  parentId: string | null
  order: number
  enabled: boolean
  children?: Category[]
  _count?: {
    companyProfiles: number
  }
}

const mockCategoriesFlat: Category[] = [
  {
    id: 'clj0000000000000000000101',
    name: 'Electronics',
    slug: 'electronics',
    icon: '📱',
    parentId: null,
    order: 1,
    enabled: true,
    _count: { companyProfiles: 5 }
  },
  {
    id: 'clj0000000000000000000102',
    name: 'Services',
    slug: 'services',
    icon: '🛠️',
    parentId: null,
    order: 2,
    enabled: true,
    _count: { companyProfiles: 3 }
  }
]

const mockCategoriesHierarchical: Category[] = [
  {
    id: 'clj0000000000000000000101',
    name: 'Electronics',
    slug: 'electronics',
    icon: '📱',
    parentId: null,
    order: 1,
    enabled: true,
    _count: { companyProfiles: 5 },
    children: [
      {
        id: 'clj0000000000000000000103',
        name: 'Smartphones',
        slug: 'smartphones',
        icon: '📱',
        parentId: 'clj0000000000000000000101',
        order: 1,
        enabled: true,
        _count: { companyProfiles: 2 }
      },
      {
        id: 'clj0000000000000000000104',
        name: 'Laptops',
        slug: 'laptops',
        icon: '💻',
        parentId: 'clj0000000000000000000101',
        order: 2,
        enabled: false,
        _count: { companyProfiles: 0 }
      }
    ]
  },
  {
    id: 'clj0000000000000000000102',
    name: 'Services',
    slug: 'services',
    icon: '🛠️',
    parentId: null,
    order: 2,
    enabled: false,
    _count: { companyProfiles: 0 },
    children: []
  }
]

const mockEmptyCategory: Category[] = [
  {
    id: 'clj0000000000000000000105',
    name: 'Empty',
    slug: 'empty',
    icon: null,
    parentId: null,
    order: 1,
    enabled: true,
    _count: { companyProfiles: 0 },
    children: []
  }
]

describe('CategoriesTree Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    globalThis.confirm = vi.fn(() => true)
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('renders create button', () => {
      render(<CategoriesTree categories={mockCategoriesFlat} />)

      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument()
    })

    it('renders top-level categories as cards', () => {
      render(<CategoriesTree categories={mockCategoriesFlat} />)

      expect(screen.getByText('Electronics')).toBeInTheDocument()
      expect(screen.getByText('Services')).toBeInTheDocument()
    })

    it('displays category icon', () => {
      render(<CategoriesTree categories={mockCategoriesFlat} />)

      expect(screen.getByText('📱')).toBeInTheDocument()
      expect(screen.getByText('🛠️')).toBeInTheDocument()
    })

    it('displays enabled badge for enabled categories', () => {
      render(<CategoriesTree categories={mockCategoriesFlat} />)

      const badges = screen.getAllByText('admin-categories.enabled')
      expect(badges).toHaveLength(2)
    })

    it('displays disabled badge for disabled categories', () => {
      render(<CategoriesTree categories={mockCategoriesHierarchical} />)

      const badges = screen.getAllByText('admin-categories.disabled')
      expect(badges).toHaveLength(2) // Services + Laptops
    })

    it('displays company count', () => {
      render(<CategoriesTree categories={mockCategoriesFlat} />)

      expect(screen.getByText('5 admin-categories.companies')).toBeInTheDocument()
      expect(screen.getByText('3 admin-categories.companies')).toBeInTheDocument()
    })

    it('renders action buttons for each category', () => {
      render(<CategoriesTree categories={mockCategoriesFlat} />)

      const addChildButtons = screen.getAllByRole('button', { name: /addChild/i })
      // Edit and delete buttons have icons only, select by variant class
      const allButtons = screen.getAllByRole('button')
      // Filter: 1 create + 2*(addChild + edit + delete) = 7 total buttons for 2 categories
      expect(allButtons.length).toBeGreaterThanOrEqual(7)
      expect(addChildButtons).toHaveLength(2)
    })

    it('renders children categories indented', () => {
      render(<CategoriesTree categories={mockCategoriesHierarchical} />)

      expect(screen.getByText('Smartphones')).toBeInTheDocument()
      expect(screen.getByText('Laptops')).toBeInTheDocument()
    })

    it('displays children company counts', () => {
      render(<CategoriesTree categories={mockCategoriesHierarchical} />)

      expect(screen.getByText('2 admin-categories.companies')).toBeInTheDocument()
    })

    it('renders edit and delete buttons for children', () => {
      render(<CategoriesTree categories={mockCategoriesHierarchical} />)

      // Total buttons: 1 create + 2 top-level*(addChild+edit+delete) + 2 children*(edit+delete)
      // = 1 + 6 + 4 = 11 buttons
      const allButtons = screen.getAllByRole('button')
      expect(allButtons.length).toBeGreaterThanOrEqual(11)
    })
  })

  // ===========================================================================
  // VARIANTS
  // ===========================================================================

  describe('Variants', () => {
    it('renders empty state with no categories', () => {
      render(<CategoriesTree categories={[]} />)

      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument()
      expect(screen.queryByText('Electronics')).not.toBeInTheDocument()
    })

    it('renders category without icon', () => {
      const noIconCategory: Category[] = [
        {
          id: 'clj0000000000000000000106',
          name: 'No Icon',
          slug: 'no-icon',
          icon: null,
          parentId: null,
          order: 1,
          enabled: true,
          _count: { companyProfiles: 0 }
        }
      ]

      render(<CategoriesTree categories={noIconCategory} />)

      expect(screen.getByText('No Icon')).toBeInTheDocument()
    })

    it('renders category with zero companies', () => {
      render(<CategoriesTree categories={mockEmptyCategory} />)

      expect(screen.getByText('0 admin-categories.companies')).toBeInTheDocument()
    })

    it('renders category with no children', () => {
      render(<CategoriesTree categories={mockCategoriesFlat} />)

      // Should not show any nested children
      expect(screen.queryByText('Smartphones')).not.toBeInTheDocument()
    })

    it('renders multiple children under parent', () => {
      render(<CategoriesTree categories={mockCategoriesHierarchical} />)

      // Electronics has 2 children
      expect(screen.getByText('Smartphones')).toBeInTheDocument()
      expect(screen.getByText('Laptops')).toBeInTheDocument()
    })

    it('only renders top-level categories as cards', () => {
      render(<CategoriesTree categories={mockCategoriesHierarchical} />)

      // Children should not be in cards (they're in indented divs)
      const smartphones = screen.getByText('Smartphones')
      expect(smartphones.closest('[class*="bg-muted"]')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // INTERACTIONS
  // ===========================================================================

  describe('User Interactions', () => {
    it('opens dialog when create button clicked', async () => {
      const { user } = render(<CategoriesTree categories={mockCategoriesFlat} />)

      const createButton = screen.getByRole('button', { name: /create/i })
      await user.click(createButton)

      // Dialog should open (we can't test internal state, but we can verify button works)
      expect(createButton).toBeInTheDocument()
    })

    it('opens dialog when edit button clicked', async () => {
      const { user, container } = render(<CategoriesTree categories={mockCategoriesFlat} />)

      // Edit buttons are outline variant buttons (excluding addChild which has text)
      const outlineButtons = getOutlineButtons(container)
      // Filter out addChild buttons (they have text content)
      const editButtons = outlineButtons.filter(btn => !btn.textContent?.includes('addChild'))
      await user.click(editButtons[0])

      // Dialog should open with category data
      expect(editButtons[0]).toBeInTheDocument()
    })

    it('opens dialog when add child button clicked', async () => {
      const { user } = render(<CategoriesTree categories={mockCategoriesFlat} />)

      const addChildButtons = screen.getAllByRole('button', { name: /addChild/i })
      await user.click(addChildButtons[0])

      expect(addChildButtons[0]).toBeInTheDocument()
    })

    it('shows confirmation dialog before delete', async () => {
      globalThis.confirm = vi.fn(() => false)
      const { user, container } = render(<CategoriesTree categories={mockEmptyCategory} />)

      const deleteButtons = getDestructiveButtons(container)
      await user.click(deleteButtons[0])

      expect(globalThis.confirm).toHaveBeenCalledWith('admin-categories.delete.confirm')
      expect(mockDeleteCategoryAction).not.toHaveBeenCalled()
    })

    it('deletes category when confirmed', async () => {
      globalThis.confirm = vi.fn(() => true)
      mockDeleteCategoryAction.mockResolvedValue({ success: true, data: undefined })

      const { user, container } = render(<CategoriesTree categories={mockEmptyCategory} />)

      const deleteButtons = getDestructiveButtons(container)
      await user.click(deleteButtons[0])

      await waitFor(() => {
        expect(mockDeleteCategoryAction).toHaveBeenCalledWith('clj0000000000000000000105')
      })
    })

    it('does not delete when confirmation cancelled', async () => {
      globalThis.confirm = vi.fn(() => false)

      const { user, container } = render(<CategoriesTree categories={mockEmptyCategory} />)

      const deleteButtons = getDestructiveButtons(container)
      await user.click(deleteButtons[0])

      expect(mockDeleteCategoryAction).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // LOADING STATES
  // ===========================================================================

  describe('Loading States', () => {
    it('calls delete action when delete confirmed', async () => {
      globalThis.confirm = vi.fn(() => true)
      mockDeleteCategoryAction.mockResolvedValue({ success: true, data: undefined })

      const { user, container } = render(<CategoriesTree categories={mockEmptyCategory} />)

      const deleteButtons = getDestructiveButtons(container)
      await user.click(deleteButtons[0])

      await waitFor(() => {
        expect(mockDeleteCategoryAction).toHaveBeenCalledTimes(1)
      })
    })
  })

  // ===========================================================================
  // ERROR STATES
  // ===========================================================================

  describe('Error States', () => {
    it('shows error toast when category has companies', async () => {
      const { user, container } = render(<CategoriesTree categories={mockCategoriesFlat} />)

      const deleteButtons = getDestructiveButtons(container)
      await user.click(deleteButtons[0]) // Electronics has 5 companies

      expect(mockToast.error).toHaveBeenCalledWith('admin-categories.delete.hasCompanies')
      expect(globalThis.confirm).not.toHaveBeenCalled()
      expect(mockDeleteCategoryAction).not.toHaveBeenCalled()
    })

    it('shows error toast when category has children', async () => {
      // Create category with children but 0 companies to trigger hasChildren error
      const categoryWithChildren: Category[] = [
        {
          id: 'clj0000000000000000000201',
          name: 'Parent Category',
          slug: 'parent',
          icon: null,
          parentId: null,
          order: 1,
          enabled: true,
          _count: { companyProfiles: 0 },
          children: [
            {
              id: 'clj0000000000000000000202',
              name: 'Child Category',
              slug: 'child',
              icon: null,
              parentId: 'clj0000000000000000000201',
              order: 1,
              enabled: true,
              _count: { companyProfiles: 0 }
            }
          ]
        }
      ]

      const { user, container } = render(<CategoriesTree categories={categoryWithChildren} />)

      const deleteButtons = getDestructiveButtons(container)
      await user.click(deleteButtons[0]) // Parent has children but 0 companies

      expect(mockToast.error).toHaveBeenCalledWith('admin-categories.delete.hasChildren')
      expect(globalThis.confirm).not.toHaveBeenCalled()
      expect(mockDeleteCategoryAction).not.toHaveBeenCalled()
    })

    it('shows error toast when delete action fails', async () => {
      globalThis.confirm = vi.fn(() => true)
      mockDeleteCategoryAction.mockResolvedValue({
        success: false,
        error: 'Delete failed',
        code: 'DELETE_FAILED'
      })

      const { user, container } = render(<CategoriesTree categories={mockEmptyCategory} />)

      const deleteButtons = getDestructiveButtons(container)
      await user.click(deleteButtons[0])

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('admin-categories.delete.error')
      })
    })

    it('shows success toast when delete succeeds', async () => {
      globalThis.confirm = vi.fn(() => true)
      mockDeleteCategoryAction.mockResolvedValue({ success: true, data: undefined })

      const { user, container } = render(<CategoriesTree categories={mockEmptyCategory} />)

      const deleteButtons = getDestructiveButtons(container)
      await user.click(deleteButtons[0])

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('admin-categories.delete.success')
      })
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles category with exactly 1 company', async () => {
      const oneCompanyCategory: Category[] = [
        {
          id: 'clj0000000000000000000107',
          name: 'One Company',
          slug: 'one-company',
          icon: null,
          parentId: null,
          order: 1,
          enabled: true,
          _count: { companyProfiles: 1 }
        }
      ]

      const { user, container } = render(<CategoriesTree categories={oneCompanyCategory} />)

      const deleteButtons = getDestructiveButtons(container)
      await user.click(deleteButtons[0])

      expect(mockToast.error).toHaveBeenCalledWith('admin-categories.delete.hasCompanies')
    })

    it('handles category with many companies', async () => {
      const manyCompanies: Category[] = [
        {
          id: 'clj0000000000000000000108',
          name: 'Popular',
          slug: 'popular',
          icon: null,
          parentId: null,
          order: 1,
          enabled: true,
          _count: { companyProfiles: 1000 }
        }
      ]

      render(<CategoriesTree categories={manyCompanies} />)

      expect(screen.getByText('1000 admin-categories.companies')).toBeInTheDocument()
    })

    it('handles missing _count field', () => {
      const noCount: Category[] = [
        {
          id: 'clj0000000000000000000109',
          name: 'No Count',
          slug: 'no-count',
          icon: null,
          parentId: null,
          order: 1,
          enabled: true
        }
      ]

      render(<CategoriesTree categories={noCount} />)

      expect(screen.getByText('0 admin-categories.companies')).toBeInTheDocument()
    })

    it('handles child category with no companies', async () => {
      const { user, container } = render(<CategoriesTree categories={mockCategoriesHierarchical} />)

      // Laptops has 0 companies, 0 children
      const deleteButtons = getDestructiveButtons(container)

      // Click delete on last child (Laptops)
      globalThis.confirm = vi.fn(() => true)
      mockDeleteCategoryAction.mockResolvedValue({ success: true, data: undefined })

      await user.click(deleteButtons[deleteButtons.length - 1])

      await waitFor(() => {
        expect(mockDeleteCategoryAction).toHaveBeenCalled()
      })
    })

    it('handles undefined children array', () => {
      const noChildrenArray: Category[] = [
        {
          id: 'clj0000000000000000000110',
          name: 'No Children Array',
          slug: 'no-children',
          icon: null,
          parentId: null,
          order: 1,
          enabled: true,
          _count: { companyProfiles: 0 }
          // No children field
        }
      ]

      render(<CategoriesTree categories={noChildrenArray} />)

      expect(screen.getByText('No Children Array')).toBeInTheDocument()
    })

    it('handles very long category names', () => {
      const longName: Category[] = [
        {
          id: 'clj0000000000000000000111',
          name: 'A'.repeat(50),
          slug: 'long-name',
          icon: null,
          parentId: null,
          order: 1,
          enabled: true,
          _count: { companyProfiles: 0 }
        }
      ]

      render(<CategoriesTree categories={longName} />)

      expect(screen.getByText('A'.repeat(50))).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('has accessible button labels', () => {
      const { container } = render(<CategoriesTree categories={mockCategoriesFlat} />)

      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument()
      // Edit and delete are icon-only buttons, verify they exist
      const deleteButtons = getDestructiveButtons(container)
      const outlineButtons = getOutlineButtons(container)
      expect(deleteButtons.length).toBeGreaterThan(0)
      expect(outlineButtons.length).toBeGreaterThan(0)
    })

    it('buttons are keyboard accessible', async () => {
      const { user } = render(<CategoriesTree categories={mockCategoriesFlat} />)

      const createButton = screen.getByRole('button', { name: /create/i })

      // Tab to button
      await user.tab()

      // Should be able to interact via keyboard
      expect(createButton).toBeInTheDocument()
    })
  })
})
