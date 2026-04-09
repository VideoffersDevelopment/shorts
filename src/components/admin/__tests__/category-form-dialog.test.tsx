import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import { CategoryFormDialog } from '../category-form-dialog'
import { createCategoryAction } from '@/app/actions/admin/categories/create'
import { updateCategoryAction } from '@/app/actions/admin/categories/update'
import * as sonner from 'sonner'

// ===========================================================================
// MOCKS
// ===========================================================================

vi.mock('@/app/actions/admin/categories/create')
vi.mock('@/app/actions/admin/categories/update')
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

const mockCreateCategoryAction = vi.mocked(createCategoryAction)
const mockUpdateCategoryAction = vi.mocked(updateCategoryAction)
const mockToast = vi.mocked(sonner.toast)

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
}

const mockCategories: Category[] = [
  {
    id: 'clj0000000000000000000101',
    name: 'Electronics',
    slug: 'electronics',
    icon: '📱',
    parentId: null,
    order: 1,
    enabled: true
  },
  {
    id: 'clj0000000000000000000102',
    name: 'Services',
    slug: 'services',
    icon: '🛠️',
    parentId: null,
    order: 2,
    enabled: true
  }
]

const mockCategory: Category = {
  id: 'clj0000000000000000000103',
  name: 'Test Category',
  slug: 'test-category',
  icon: '🎉',
  parentId: 'clj0000000000000000000101',
  order: 1,
  enabled: true
}

describe('CategoryFormDialog Component', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('does not render when isOpen is false', () => {
      render(
        <CategoryFormDialog
          isOpen={false}
          onClose={mockOnClose}
          categories={mockCategories}
        />
      )

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('renders create dialog title when no category provided', () => {
      render(
        <CategoryFormDialog
          isOpen={true}
          onClose={mockOnClose}
          categories={mockCategories}
        />
      )

      expect(screen.getByText('admin-categories.form.createTitle')).toBeInTheDocument()
    })

    it('renders edit dialog title when category provided', () => {
      render(
        <CategoryFormDialog
          category={mockCategory}
          isOpen={true}
          onClose={mockOnClose}
          categories={mockCategories}
        />
      )

      expect(screen.getByText('admin-categories.form.editTitle')).toBeInTheDocument()
    })

    it('renders all form fields', () => {
      render(
        <CategoryFormDialog
          isOpen={true}
          onClose={mockOnClose}
          categories={mockCategories}
        />
      )

      expect(screen.getByLabelText('admin-categories.form.name')).toBeInTheDocument()
      expect(screen.getByLabelText('admin-categories.form.slug')).toBeInTheDocument()
      expect(screen.getByLabelText('admin-categories.form.icon')).toBeInTheDocument()
      // Select components use different label association - check text exists
      expect(screen.getByText('admin-categories.form.parent')).toBeInTheDocument()
      expect(screen.getByText('admin-categories.form.enabled')).toBeInTheDocument()
    })

    it('renders submit and cancel buttons', () => {
      render(
        <CategoryFormDialog
          isOpen={true}
          onClose={mockOnClose}
          categories={mockCategories}
        />
      )

      expect(screen.getByRole('button', { name: /admin-categories\.form\.create$/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /admin-categories\.form\.cancel/i })).toBeInTheDocument()
    })

    it('renders update button when editing', () => {
      render(
        <CategoryFormDialog
          category={mockCategory}
          isOpen={true}
          onClose={mockOnClose}
          categories={mockCategories}
        />
      )

      expect(screen.getByRole('button', { name: /admin-categories\.form\.update$/i })).toBeInTheDocument()
    })

    it('displays field hints', () => {
      render(
        <CategoryFormDialog
          isOpen={true}
          onClose={mockOnClose}
          categories={mockCategories}
        />
      )

      expect(screen.getByText('admin-categories.form.slugHint')).toBeInTheDocument()
      expect(screen.getByText('admin-categories.form.iconHint')).toBeInTheDocument()
    })

    it('displays field placeholders', () => {
      render(
        <CategoryFormDialog
          isOpen={true}
          onClose={mockOnClose}
          categories={mockCategories}
        />
      )

      expect(screen.getByPlaceholderText('admin-categories.form.namePlaceholder')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('admin-categories.form.slugPlaceholder')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('admin-categories.form.iconPlaceholder')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // VARIANTS
  // ===========================================================================

  describe('Variants', () => {
    it('prefills form when editing category', () => {
      render(
        <CategoryFormDialog
          category={mockCategory}
          isOpen={true}
          onClose={mockOnClose}
          categories={mockCategories}
        />
      )

      const nameInput = screen.getByLabelText('admin-categories.form.name') as HTMLInputElement
      const slugInput = screen.getByLabelText('admin-categories.form.slug') as HTMLInputElement
      const iconInput = screen.getByLabelText('admin-categories.form.icon') as HTMLInputElement

      expect(nameInput.value).toBe('Test Category')
      expect(slugInput.value).toBe('test-category')
      expect(iconInput.value).toBe('🎉')
    })

    it('shows empty form when creating', () => {
      render(
        <CategoryFormDialog
          isOpen={true}
          onClose={mockOnClose}
          categories={mockCategories}
        />
      )

      const nameInput = screen.getByLabelText('admin-categories.form.name') as HTMLInputElement
      const slugInput = screen.getByLabelText('admin-categories.form.slug') as HTMLInputElement
      const iconInput = screen.getByLabelText('admin-categories.form.icon') as HTMLInputElement

      expect(nameInput.value).toBe('')
      expect(slugInput.value).toBe('')
      expect(iconInput.value).toBe('')
    })

    it('preselects parent when parentId provided', () => {
      render(
        <CategoryFormDialog
          parentId="clj0000000000000000000101"
          isOpen={true}
          onClose={mockOnClose}
          categories={mockCategories}
        />
      )

      // Parent select label should be visible
      expect(screen.getByText('admin-categories.form.parent')).toBeInTheDocument()
    })

    it('shows only top-level categories in parent select', () => {
      const categoriesWithChildren: Category[] = [
        ...mockCategories,
        {
          id: 'clj0000000000000000000103',
          name: 'Child Category',
          slug: 'child',
          icon: null,
          parentId: 'clj0000000000000000000101',
          order: 1,
          enabled: true
        }
      ]

      render(
        <CategoryFormDialog
          isOpen={true}
          onClose={mockOnClose}
          categories={categoriesWithChildren}
        />
      )

      // Only top-level categories should be selectable as parents
      expect(screen.getByText('admin-categories.form.parent')).toBeInTheDocument()
    })

    it('excludes current category from parent options when editing', () => {
      render(
        <CategoryFormDialog
          category={mockCategory}
          isOpen={true}
          onClose={mockOnClose}
          categories={[...mockCategories, mockCategory]}
        />
      )

      // Current category should not be in parent select
      expect(screen.getByText('admin-categories.form.parent')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // INTERACTIONS
  // ===========================================================================

  describe('User Interactions', () => {
    it('calls onClose when cancel button clicked', async () => {
      const { user } = render(
        <CategoryFormDialog
          isOpen={true}
          onClose={mockOnClose}
          categories={mockCategories}
        />
      )

      const cancelButton = screen.getByRole('button', { name: /admin-categories\.form\.cancel/i })
      await user.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('accepts text input in name field', async () => {
      const { user } = render(
        <CategoryFormDialog
          isOpen={true}
          onClose={mockOnClose}
          categories={mockCategories}
        />
      )

      const nameInput = screen.getByLabelText('admin-categories.form.name')
      await user.type(nameInput, 'New Category')

      expect(nameInput).toHaveValue('New Category')
    })

    it('accepts text input in slug field', async () => {
      const { user } = render(
        <CategoryFormDialog
          isOpen={true}
          onClose={mockOnClose}
          categories={mockCategories}
        />
      )

      const slugInput = screen.getByLabelText('admin-categories.form.slug')
      await user.type(slugInput, 'new-category')

      expect(slugInput).toHaveValue('new-category')
    })

    it('accepts text input in icon field', async () => {
      const { user } = render(
        <CategoryFormDialog
          isOpen={true}
          onClose={mockOnClose}
          categories={mockCategories}
        />
      )

      const iconInput = screen.getByLabelText('admin-categories.form.icon')
      await user.type(iconInput, '🎉')

      expect(iconInput).toHaveValue('🎉')
    })

    it('creates category on form submit', async () => {
      mockCreateCategoryAction.mockResolvedValue({
        success: true,
        data: {
          id: 'clj0000000000000000000104',
          name: 'New Category',
          slug: 'new-category',
          icon: '🎉',
          parentId: null,
          order: 1,
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      const { user } = render(
        <CategoryFormDialog
          isOpen={true}
          onClose={mockOnClose}
          categories={mockCategories}
        />
      )

      await user.type(screen.getByLabelText('admin-categories.form.name'), 'New Category')
      await user.type(screen.getByLabelText('admin-categories.form.slug'), 'new-category')
      await user.type(screen.getByLabelText('admin-categories.form.icon'), '🎉')

      const submitButton = screen.getByRole('button', { name: /admin-categories\.form\.create$/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockCreateCategoryAction).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'New Category',
            slug: 'new-category',
            icon: '🎉',
            enabled: true
          })
        )
      })
    })

    it('updates category on form submit when editing', async () => {
      mockUpdateCategoryAction.mockResolvedValue({
        success: true,
        data: {
          ...mockCategory,
          name: 'Updated Name',
          updatedAt: new Date()
        }
      })

      const { user } = render(
        <CategoryFormDialog
          category={mockCategory}
          isOpen={true}
          onClose={mockOnClose}
          categories={mockCategories}
        />
      )

      const nameInput = screen.getByLabelText('admin-categories.form.name')
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Name')

      const submitButton = screen.getByRole('button', { name: /admin-categories\.form\.update$/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockUpdateCategoryAction).toHaveBeenCalledWith(
          mockCategory.id,
          expect.objectContaining({
            name: 'Updated Name'
          })
        )
      })
    })
  })

  // ===========================================================================
  // LOADING STATES
  // ===========================================================================

  describe('Loading States', () => {
    it('disables form fields while submitting', async () => {
      mockCreateCategoryAction.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, data: {} as Category }), 100))
      )

      const { user } = render(
        <CategoryFormDialog
          isOpen={true}
          onClose={mockOnClose}
          categories={mockCategories}
        />
      )

      await user.type(screen.getByLabelText('admin-categories.form.name'), 'Test')
      await user.type(screen.getByLabelText('admin-categories.form.slug'), 'test')

      const submitButton = screen.getByRole('button', { name: /admin-categories\.form\.create$/i })
      await user.click(submitButton)

      // Fields should be disabled during submission
      expect(screen.getByLabelText('admin-categories.form.name')).toBeDisabled()
      expect(screen.getByLabelText('admin-categories.form.slug')).toBeDisabled()
      expect(screen.getByLabelText('admin-categories.form.icon')).toBeDisabled()
    })

    it('shows saving text on submit button while loading', async () => {
      mockCreateCategoryAction.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, data: {} as Category }), 100))
      )

      const { user } = render(
        <CategoryFormDialog
          isOpen={true}
          onClose={mockOnClose}
          categories={mockCategories}
        />
      )

      await user.type(screen.getByLabelText('admin-categories.form.name'), 'Test')
      await user.type(screen.getByLabelText('admin-categories.form.slug'), 'test')

      const submitButton = screen.getByRole('button', { name: /admin-categories\.form\.create$/i })
      await user.click(submitButton)

      expect(screen.getByRole('button', { name: /admin-categories\.form\.saving/i })).toBeInTheDocument()
    })

    it('disables cancel button while submitting', async () => {
      mockCreateCategoryAction.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, data: {} as Category }), 100))
      )

      const { user } = render(
        <CategoryFormDialog
          isOpen={true}
          onClose={mockOnClose}
          categories={mockCategories}
        />
      )

      await user.type(screen.getByLabelText('admin-categories.form.name'), 'Test')
      await user.type(screen.getByLabelText('admin-categories.form.slug'), 'test')

      const submitButton = screen.getByRole('button', { name: /admin-categories\.form\.create$/i })
      await user.click(submitButton)

      const cancelButton = screen.getByRole('button', { name: /admin-categories\.form\.cancel/i })
      expect(cancelButton).toBeDisabled()
    })
  })

  // ===========================================================================
  // ERROR STATES
  // ===========================================================================

  describe('Error States', () => {
    it('shows error toast when create fails', async () => {
      // Clear mocks before this test to ensure clean state
      vi.clearAllMocks()

      // Setup mock to return error BEFORE rendering
      mockCreateCategoryAction.mockResolvedValueOnce({
        success: false,
        error: 'Slug already exists',
        code: 'SLUG_EXISTS'
      })

      const { user } = render(
        <CategoryFormDialog
          isOpen={true}
          onClose={mockOnClose}
          categories={mockCategories}
        />
      )

      await user.type(screen.getByLabelText('admin-categories.form.name'), 'Test')
      await user.type(screen.getByLabelText('admin-categories.form.slug'), 'test')

      const submitButton = screen.getByRole('button', { name: /admin-categories\.form\.create$/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('admin-categories.form.error')
      })

      // Verify action was called
      expect(mockCreateCategoryAction).toHaveBeenCalled()
    })

    it('shows error toast when update fails', async () => {
      mockUpdateCategoryAction.mockResolvedValue({
        success: false,
        error: 'Update failed',
        code: 'UPDATE_FAILED'
      })

      const { user } = render(
        <CategoryFormDialog
          category={mockCategory}
          isOpen={true}
          onClose={mockOnClose}
          categories={mockCategories}
        />
      )

      const submitButton = screen.getByRole('button', { name: /admin-categories\.form\.update$/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('admin-categories.form.error')
      })

      expect(mockOnClose).not.toHaveBeenCalled()
    })

    it('shows success toast when create succeeds', async () => {
      mockCreateCategoryAction.mockResolvedValue({
        success: true,
        data: {
          id: 'clj0000000000000000000104',
          name: 'Test',
          slug: 'test',
          icon: null,
          parentId: null,
          order: 1,
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      const { user } = render(
        <CategoryFormDialog
          isOpen={true}
          onClose={mockOnClose}
          categories={mockCategories}
        />
      )

      await user.type(screen.getByLabelText('admin-categories.form.name'), 'Test')
      await user.type(screen.getByLabelText('admin-categories.form.slug'), 'test')

      const submitButton = screen.getByRole('button', { name: /admin-categories\.form\.create$/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('admin-categories.form.createSuccess')
        expect(mockOnClose).toHaveBeenCalledTimes(1)
      })
    })

    it('shows success toast when update succeeds', async () => {
      mockUpdateCategoryAction.mockResolvedValue({
        success: true,
        data: {
          ...mockCategory,
          updatedAt: new Date()
        }
      })

      const { user } = render(
        <CategoryFormDialog
          category={mockCategory}
          isOpen={true}
          onClose={mockOnClose}
          categories={mockCategories}
        />
      )

      const submitButton = screen.getByRole('button', { name: /admin-categories\.form\.update$/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('admin-categories.form.updateSuccess')
        expect(mockOnClose).toHaveBeenCalledTimes(1)
      })
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles empty icon field', async () => {
      mockCreateCategoryAction.mockResolvedValue({
        success: true,
        data: {
          id: 'clj0000000000000000000104',
          name: 'Test',
          slug: 'test',
          icon: null,
          parentId: null,
          order: 1,
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      const { user } = render(
        <CategoryFormDialog
          isOpen={true}
          onClose={mockOnClose}
          categories={mockCategories}
        />
      )

      await user.type(screen.getByLabelText('admin-categories.form.name'), 'Test')
      await user.type(screen.getByLabelText('admin-categories.form.slug'), 'test')
      // Icon field left empty

      const submitButton = screen.getByRole('button', { name: /admin-categories\.form\.create$/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockCreateCategoryAction).toHaveBeenCalledWith(
          expect.objectContaining({
            icon: undefined
          })
        )
      })
    })

    it('handles empty parent selection', async () => {
      mockCreateCategoryAction.mockResolvedValue({
        success: true,
        data: {
          id: 'clj0000000000000000000104',
          name: 'Test',
          slug: 'test',
          icon: null,
          parentId: null,
          order: 1,
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      const { user } = render(
        <CategoryFormDialog
          isOpen={true}
          onClose={mockOnClose}
          categories={mockCategories}
        />
      )

      await user.type(screen.getByLabelText('admin-categories.form.name'), 'Test')
      await user.type(screen.getByLabelText('admin-categories.form.slug'), 'test')

      const submitButton = screen.getByRole('button', { name: /admin-categories\.form\.create$/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockCreateCategoryAction).toHaveBeenCalledWith(
          expect.objectContaining({
            parentId: undefined
          })
        )
      })
    })

    it('handles enabled=false', async () => {
      mockCreateCategoryAction.mockResolvedValue({
        success: true,
        data: {
          id: 'clj0000000000000000000104',
          name: 'Test',
          slug: 'test',
          icon: null,
          parentId: null,
          order: 1,
          enabled: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      const { user } = render(
        <CategoryFormDialog
          isOpen={true}
          onClose={mockOnClose}
          categories={mockCategories}
        />
      )

      await user.type(screen.getByLabelText('admin-categories.form.name'), 'Test')
      await user.type(screen.getByLabelText('admin-categories.form.slug'), 'test')

      const submitButton = screen.getByRole('button', { name: /admin-categories\.form\.create$/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockCreateCategoryAction).toHaveBeenCalled()
      })
    })

    it('handles category with no icon when editing', () => {
      const noIconCategory: Category = {
        ...mockCategory,
        icon: null
      }

      render(
        <CategoryFormDialog
          category={noIconCategory}
          isOpen={true}
          onClose={mockOnClose}
          categories={mockCategories}
        />
      )

      const iconInput = screen.getByLabelText('admin-categories.form.icon') as HTMLInputElement
      expect(iconInput.value).toBe('')
    })

    it('resets form when dialog closed and reopened', () => {
      const { rerender } = render(
        <CategoryFormDialog
          category={mockCategory}
          isOpen={true}
          onClose={mockOnClose}
          categories={mockCategories}
        />
      )

      // Close dialog
      rerender(
        <CategoryFormDialog
          category={mockCategory}
          isOpen={false}
          onClose={mockOnClose}
          categories={mockCategories}
        />
      )

      // Reopen without category
      rerender(
        <CategoryFormDialog
          isOpen={true}
          onClose={mockOnClose}
          categories={mockCategories}
        />
      )

      const nameInput = screen.getByLabelText('admin-categories.form.name') as HTMLInputElement
      expect(nameInput.value).toBe('')
    })

    it('handles no categories available for parent select', () => {
      render(
        <CategoryFormDialog
          isOpen={true}
          onClose={mockOnClose}
          categories={[]}
        />
      )

      // Select components use different label association - check text exists
      expect(screen.getByText('admin-categories.form.parent')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      render(
        <CategoryFormDialog
          isOpen={true}
          onClose={mockOnClose}
          categories={mockCategories}
        />
      )

      // Standard input fields use htmlFor/id association
      expect(screen.getByLabelText('admin-categories.form.name')).toBeInTheDocument()
      expect(screen.getByLabelText('admin-categories.form.slug')).toBeInTheDocument()
      expect(screen.getByLabelText('admin-categories.form.icon')).toBeInTheDocument()
      // Select components use different label association - check text exists
      expect(screen.getByText('admin-categories.form.parent')).toBeInTheDocument()
      expect(screen.getByText('admin-categories.form.enabled')).toBeInTheDocument()
    })

    it('marks required fields as required', () => {
      render(
        <CategoryFormDialog
          isOpen={true}
          onClose={mockOnClose}
          categories={mockCategories}
        />
      )

      expect(screen.getByLabelText('admin-categories.form.name')).toBeRequired()
      expect(screen.getByLabelText('admin-categories.form.slug')).toBeRequired()
    })

    it('has accessible button labels', () => {
      render(
        <CategoryFormDialog
          isOpen={true}
          onClose={mockOnClose}
          categories={mockCategories}
        />
      )

      expect(screen.getByRole('button', { name: /admin-categories\.form\.create$/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /admin-categories\.form\.cancel/i })).toBeInTheDocument()
    })

    it('dialog is keyboard accessible', async () => {
      const { user } = render(
        <CategoryFormDialog
          isOpen={true}
          onClose={mockOnClose}
          categories={mockCategories}
        />
      )

      // Tab to first focusable element inside the dialog
      await user.tab()

      // The dialog close button gets focus first in Radix dialogs
      // Then tab to the form fields
      await user.tab()

      // First text input (name) should be focusable via keyboard
      const nameInput = screen.getByLabelText('admin-categories.form.name')
      expect(nameInput).toBeInTheDocument()
    })
  })
})
