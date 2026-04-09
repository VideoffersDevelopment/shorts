import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import { ProfileForm } from './profile-form'
import { updateProfileAction } from '@/app/actions/profile/update'
import { toast } from 'sonner'
import type { UserProfile } from '@prisma/client'

// Mock the server action
vi.mock('@/app/actions/profile/update', () => ({
  updateProfileAction: vi.fn(),
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockUpdateProfileAction = vi.mocked(updateProfileAction)
const mockToast = vi.mocked(toast)

describe('ProfileForm', () => {
  const mockProfile: UserProfile = {
    id: 'profile-1',
    userId: 'user-1',
    displayName: 'John Doe',
    bio: 'Test bio',
    location: 'New York',
    avatar: 'https://example.com/avatar.jpg',
    latitude: null,
    longitude: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const userEmail = 'user@example.com'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('renders profile form with all fields', () => {
      render(<ProfileForm profile={mockProfile} userEmail={userEmail} />)

      expect(screen.getByLabelText(/profile\.displayName/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/profile\.bio/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/profile\.location/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /profile\.save/i })).toBeInTheDocument()
    })

    it('renders form title', () => {
      render(<ProfileForm profile={mockProfile} userEmail={userEmail} />)

      expect(screen.getByRole('heading', { name: /profile\.title/i })).toBeInTheDocument()
    })

    it('renders avatar upload component', () => {
      render(<ProfileForm profile={mockProfile} userEmail={userEmail} />)

      expect(screen.getByText(/profile\.avatar/i)).toBeInTheDocument()
    })

    it('populates fields with existing profile data', () => {
      render(<ProfileForm profile={mockProfile} userEmail={userEmail} />)

      expect(screen.getByLabelText(/profile\.displayName/i)).toHaveValue('John Doe')
      expect(screen.getByLabelText(/profile\.bio/i)).toHaveValue('Test bio')
      expect(screen.getByLabelText(/profile\.location/i)).toHaveValue('New York')
    })

    it('renders empty fields when profile is null', () => {
      render(<ProfileForm profile={null} userEmail={userEmail} />)

      expect(screen.getByLabelText(/profile\.displayName/i)).toHaveValue('')
      expect(screen.getByLabelText(/profile\.bio/i)).toHaveValue('')
      expect(screen.getByLabelText(/profile\.location/i)).toHaveValue('')
    })

    it('displays bio character counter', () => {
      render(<ProfileForm profile={mockProfile} userEmail={userEmail} />)

      expect(screen.getByText('8/500')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // USER INTERACTIONS
  // ===========================================================================

  describe('User Interactions', () => {
    it('allows typing in display name field', async () => {
      const { user } = render(<ProfileForm profile={null} userEmail={userEmail} />)

      const input = screen.getByLabelText(/profile\.displayName/i)
      await user.type(input, 'New Name')

      expect(input).toHaveValue('New Name')
    })

    it('allows typing in bio field', async () => {
      const { user } = render(<ProfileForm profile={null} userEmail={userEmail} />)

      const textarea = screen.getByLabelText(/profile\.bio/i)
      await user.type(textarea, 'New bio text')

      expect(textarea).toHaveValue('New bio text')
    })

    it('allows typing in location field', async () => {
      const { user } = render(<ProfileForm profile={null} userEmail={userEmail} />)

      const input = screen.getByLabelText(/profile\.location/i)
      await user.type(input, 'Los Angeles')

      expect(input).toHaveValue('Los Angeles')
    })

    it('updates bio character counter while typing', async () => {
      const { user } = render(<ProfileForm profile={null} userEmail={userEmail} />)

      const textarea = screen.getByLabelText(/profile\.bio/i)
      await user.type(textarea, 'Hello')

      expect(screen.getByText('5/500')).toBeInTheDocument()
    })

    it('submits form with valid data', async () => {
      mockUpdateProfileAction.mockResolvedValue({ success: true })

      const { user } = render(<ProfileForm profile={null} userEmail={userEmail} />)

      await user.type(screen.getByLabelText(/profile\.displayName/i), 'Test User')
      await user.type(screen.getByLabelText(/profile\.bio/i), 'Test bio')
      await user.type(screen.getByLabelText(/profile\.location/i), 'Test City')
      await user.click(screen.getByRole('button', { name: /profile\.save/i }))

      await waitFor(() => {
        expect(mockUpdateProfileAction).toHaveBeenCalledWith({
          displayName: 'Test User',
          bio: 'Test bio',
          location: 'Test City',
          avatar: undefined,
        })
      })
    })

    it('submits form with existing profile data', async () => {
      mockUpdateProfileAction.mockResolvedValue({ success: true })

      const { user } = render(<ProfileForm profile={mockProfile} userEmail={userEmail} />)

      await user.click(screen.getByRole('button', { name: /profile\.save/i }))

      await waitFor(() => {
        expect(mockUpdateProfileAction).toHaveBeenCalledWith({
          displayName: 'John Doe',
          bio: 'Test bio',
          location: 'New York',
          avatar: 'https://example.com/avatar.jpg',
        })
      })
    })
  })

  // ===========================================================================
  // LOADING STATES
  // ===========================================================================

  describe('Loading States', () => {
    it('shows saving text while submitting', async () => {
      mockUpdateProfileAction.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      )

      const { user } = render(<ProfileForm profile={mockProfile} userEmail={userEmail} />)

      await user.click(screen.getByRole('button', { name: /profile\.save/i }))

      expect(screen.getByRole('button', { name: /profile\.saving/i })).toBeInTheDocument()
    })

    it('disables submit button while saving', async () => {
      mockUpdateProfileAction.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      )

      const { user } = render(<ProfileForm profile={mockProfile} userEmail={userEmail} />)

      await user.click(screen.getByRole('button', { name: /profile\.save/i }))

      expect(screen.getByRole('button', { name: /profile\.saving/i })).toBeDisabled()
    })

    it('re-enables submit button after save completes', async () => {
      mockUpdateProfileAction.mockResolvedValue({ success: true })

      const { user } = render(<ProfileForm profile={mockProfile} userEmail={userEmail} />)

      await user.click(screen.getByRole('button', { name: /profile\.save/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /profile\.save/i })).not.toBeDisabled()
      })
    })
  })

  // ===========================================================================
  // SUCCESS STATES
  // ===========================================================================

  describe('Success States', () => {
    it('shows success toast after successful save', async () => {
      mockUpdateProfileAction.mockResolvedValue({ success: true })

      const { user } = render(<ProfileForm profile={mockProfile} userEmail={userEmail} />)

      const submitButton = screen.getByRole('button', { name: /profile\.save/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalled()
      })
    })
  })

  // ===========================================================================
  // ERROR STATES
  // ===========================================================================

  describe('Error States', () => {
    it('shows error toast on server error', async () => {
      mockUpdateProfileAction.mockResolvedValue({ error: 'Server error' })

      const { user } = render(<ProfileForm profile={mockProfile} userEmail={userEmail} />)

      const submitButton = screen.getByRole('button', { name: /profile\.save/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Server error')
      })
    })

    it('shows success toast after previous error on resubmission', async () => {
      mockUpdateProfileAction
        .mockResolvedValueOnce({ error: 'First error' })
        .mockResolvedValueOnce({ success: true })

      const { user } = render(<ProfileForm profile={mockProfile} userEmail={userEmail} />)

      // First submission - error
      const submitButton = screen.getByRole('button', { name: /profile\.save/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('First error')
      })

      // Second submission - success
      await user.click(screen.getByRole('button', { name: /profile\.save/i }))

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalled()
      })
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('has proper labels for all form fields', () => {
      render(<ProfileForm profile={mockProfile} userEmail={userEmail} />)

      expect(screen.getByLabelText(/profile\.displayName/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/profile\.bio/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/profile\.location/i)).toBeInTheDocument()
    })

    it('uses proper input types', () => {
      render(<ProfileForm profile={mockProfile} userEmail={userEmail} />)

      expect(screen.getByLabelText(/profile\.displayName/i)).toHaveAttribute('type', 'text')
      expect(screen.getByLabelText(/profile\.location/i)).toHaveAttribute('type', 'text')
    })

    // Note: Toast notifications from Sonner are rendered in a portal and are
    // accessible by default (using aria-live regions). We verify toast is called
    // in the Success/Error States sections above.
  })
})
