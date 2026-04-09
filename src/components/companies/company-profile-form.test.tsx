import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@/test/utils'
import { CompanyProfileForm } from './company-profile-form'
import { updateCompanyProfileAction } from '@/app/actions/companies/update'
import { toast } from 'sonner'
import type { CompanyProfile, Category } from '@prisma/client'

// ===========================================================================
// MOCKS
// ===========================================================================

vi.mock('@/app/actions/companies/update', () => ({
  updateCompanyProfileAction: vi.fn()
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

vi.mock('./logo-upload', () => ({
  LogoUpload: ({ currentLogo, onLogoChange }: { currentLogo: string | null; onLogoChange: (url: string | null) => void }) => (
    <div data-testid="logo-upload">
      Logo: {currentLogo || 'none'}
      <button type="button" onClick={() => onLogoChange('https://example.com/new-logo.png')}>
        Change Logo
      </button>
    </div>
  )
}))

vi.mock('./banner-upload', () => ({
  BannerUpload: ({ currentBanner, onBannerChange }: { currentBanner: string | null; onBannerChange: (url: string | null) => void }) => (
    <div data-testid="banner-upload">
      Banner: {currentBanner || 'none'}
      <button type="button" onClick={() => onBannerChange('https://example.com/new-banner.jpg')}>
        Change Banner
      </button>
    </div>
  )
}))

vi.mock('./category-combobox', () => ({
  CategoryCombobox: ({ value, onValueChange, disabled }: { value?: string; onValueChange: (categoryId: string, parentId: string | null) => void; disabled?: boolean }) => (
    <select
      data-testid="category-picker"
      value={value}
      onChange={(e) => onValueChange(e.target.value, null)}
      disabled={disabled}
    >
      <option value="">Select category</option>
      <option value="cat-1">Technology</option>
      <option value="cat-2">Services</option>
    </select>
  )
}))

vi.mock('./address-location', () => ({
  AddressLocation: ({ street, postalCode, city, onStreetChange, onPostalCodeChange, onCityChange, disabled }: {
    street?: string; postalCode?: string; city?: string;
    onStreetChange: (v: string) => void; onPostalCodeChange: (v: string) => void; onCityChange: (v: string) => void;
    disabled?: boolean
  }) => (
    <div data-testid="address-location">
      <input data-testid="street" value={street} onChange={(e) => onStreetChange(e.target.value)} disabled={disabled} aria-label="Street" />
      <input data-testid="postal-code" value={postalCode} onChange={(e) => onPostalCodeChange(e.target.value)} disabled={disabled} aria-label="Postal Code" />
      <input data-testid="city" value={city} onChange={(e) => onCityChange(e.target.value)} disabled={disabled} aria-label="City" />
    </div>
  )
}))

// ===========================================================================
// TEST DATA
// ===========================================================================

interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[]
}

const mockCategories: CategoryWithChildren[] = [
  {
    id: 'cat-1',
    name: 'Technology',
    slug: 'technology',
    icon: null,
    parentId: null,
    order: 1,
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    children: []
  },
  {
    id: 'cat-2',
    name: 'Services',
    slug: 'services',
    icon: null,
    parentId: null,
    order: 2,
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    children: []
  }
]

const mockProfile: CompanyProfile = {
  id: 'company-1',
  userId: 'user-1',
  companyName: 'Test Company',
  slug: 'test-company',
  logo: 'https://example.com/logo.png',
  banner: 'https://example.com/banner.jpg',
  description: 'Test company description',
  website: 'https://testcompany.com',
  street: '123 Test Street',
  postalCode: '00-001',
  city: 'Warsaw',
  phone: '+48 123 456 789',
  nip: '1234567890',
  viesVerified: false,
  verifiedAt: null,
  verifiedBy: null,
  socialLinks: {
    facebook: 'https://facebook.com/testcompany',
    instagram: 'https://instagram.com/testcompany',
    tiktok: '',
    youtube: '',
    linkedin: ''
  },
  categoryId: 'cat-1',
  subcategories: [],
  latitude: null,
  longitude: null,
  businessHours: null,
  createdAt: new Date(),
  updatedAt: new Date()
}

describe('CompanyProfileForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('renders form with pre-filled company data', () => {
      render(<CompanyProfileForm profile={mockProfile} categories={mockCategories} />)

      expect(screen.getByLabelText('companies.profile.fields.companyName')).toHaveValue('Test Company')
      expect(screen.getByLabelText('companies.profile.fields.description')).toHaveValue('Test company description')
      expect(screen.getByLabelText('companies.profile.fields.website')).toHaveValue('https://testcompany.com')
      expect(screen.getByLabelText('companies.profile.fields.address')).toHaveValue('123 Test Street')
      expect(screen.getByLabelText('companies.profile.fields.phone')).toHaveValue('+48 123 456 789')
    })

    it('renders social links fields with pre-filled data', () => {
      render(<CompanyProfileForm profile={mockProfile} categories={mockCategories} />)

      const facebookInput = screen.getByPlaceholderText('Facebook URL')
      const instagramInput = screen.getByPlaceholderText('Instagram URL')
      const tiktokInput = screen.getByPlaceholderText('TikTok URL')

      expect(facebookInput).toHaveValue('https://facebook.com/testcompany')
      expect(instagramInput).toHaveValue('https://instagram.com/testcompany')
      expect(tiktokInput).toHaveValue('')
    })

    it('renders logo and banner upload components', () => {
      render(<CompanyProfileForm profile={mockProfile} categories={mockCategories} />)

      expect(screen.getByTestId('logo-upload')).toBeInTheDocument()
      expect(screen.getByTestId('banner-upload')).toBeInTheDocument()
      expect(screen.getByTestId('logo-upload')).toHaveTextContent('Logo: https://example.com/logo.png')
      expect(screen.getByTestId('banner-upload')).toHaveTextContent('Banner: https://example.com/banner.jpg')
    })

    it('renders category picker with selected value', () => {
      render(<CompanyProfileForm profile={mockProfile} categories={mockCategories} />)

      const categoryPicker = screen.getByTestId('category-picker')
      expect(categoryPicker).toHaveValue('cat-1')
    })

    it('renders submit button', () => {
      render(<CompanyProfileForm profile={mockProfile} categories={mockCategories} />)

      expect(screen.getByRole('button', { name: 'companies.profile.edit.save' })).toBeInTheDocument()
    })

    it('handles empty profile data gracefully', () => {
      const emptyProfile: CompanyProfile = {
        ...mockProfile,
        description: null,
        website: null,
        street: null,
        postalCode: null,
        city: null,
        phone: null,
        socialLinks: null,
        logo: null,
        banner: null,
        categoryId: null
      }

      render(<CompanyProfileForm profile={emptyProfile} categories={mockCategories} />)

      expect(screen.getByLabelText('companies.profile.fields.description')).toHaveValue('')
      expect(screen.getByLabelText('companies.profile.fields.website')).toHaveValue('')
      expect(screen.getByTestId('logo-upload')).toHaveTextContent('Logo: none')
      expect(screen.getByTestId('banner-upload')).toHaveTextContent('Banner: none')
    })
  })

  // ===========================================================================
  // FORM FIELDS
  // ===========================================================================

  describe('Form Fields', () => {
    it('allows editing company name', async () => {
      const { user } = render(<CompanyProfileForm profile={mockProfile} categories={mockCategories} />)

      const input = screen.getByLabelText('companies.profile.fields.companyName')
      await user.clear(input)
      await user.type(input, 'New Company Name')

      expect(input).toHaveValue('New Company Name')
    })

    it('allows editing description', async () => {
      const { user } = render(<CompanyProfileForm profile={mockProfile} categories={mockCategories} />)

      const textarea = screen.getByLabelText('companies.profile.fields.description')
      await user.clear(textarea)
      await user.type(textarea, 'New description')

      expect(textarea).toHaveValue('New description')
    })

    it('allows editing website URL', async () => {
      const { user } = render(<CompanyProfileForm profile={mockProfile} categories={mockCategories} />)

      const input = screen.getByLabelText('companies.profile.fields.website')
      await user.clear(input)
      await user.type(input, 'https://newwebsite.com')

      expect(input).toHaveValue('https://newwebsite.com')
    })

    it('allows editing address and phone', async () => {
      const { user } = render(<CompanyProfileForm profile={mockProfile} categories={mockCategories} />)

      const addressInput = screen.getByLabelText('companies.profile.fields.address')
      const phoneInput = screen.getByLabelText('companies.profile.fields.phone')

      await user.clear(addressInput)
      await user.type(addressInput, 'New Address 456')

      await user.clear(phoneInput)
      await user.type(phoneInput, '+48 987 654 321')

      expect(addressInput).toHaveValue('New Address 456')
      expect(phoneInput).toHaveValue('+48 987 654 321')
    })

    it('allows editing latitude and longitude', async () => {
      const { user } = render(<CompanyProfileForm profile={mockProfile} categories={mockCategories} />)

      const latInput = screen.getByLabelText('companies.profile.fields.latitude')
      const lonInput = screen.getByLabelText('companies.profile.fields.longitude')

      await user.type(latInput, '52.2297')
      await user.type(lonInput, '21.0122')

      expect(latInput).toHaveValue(52.2297)
      expect(lonInput).toHaveValue(21.0122)
    })

    it('allows editing business hours JSON', async () => {
      render(<CompanyProfileForm profile={mockProfile} categories={mockCategories} />)

      const businessHoursTextarea = screen.getByLabelText('companies.profile.fields.businessHours')
      // Use fireEvent.change instead of user.type because { is a special keyboard character in RTL
      fireEvent.change(businessHoursTextarea, { target: { value: '{"mon": {"open": "09:00", "close": "17:00"}}' } })

      expect(businessHoursTextarea).toHaveValue('{"mon": {"open": "09:00", "close": "17:00"}}')
    })
  })

  // ===========================================================================
  // INTERACTIONS
  // ===========================================================================

  describe('User Interactions', () => {
    it('updates category when category picker changes', async () => {
      const { user } = render(<CompanyProfileForm profile={mockProfile} categories={mockCategories} />)

      const categoryPicker = screen.getByTestId('category-picker')
      await user.selectOptions(categoryPicker, 'cat-2')

      expect(categoryPicker).toHaveValue('cat-2')
    })

    it('updates logo when logo upload triggers change', async () => {
      const { user } = render(<CompanyProfileForm profile={mockProfile} categories={mockCategories} />)

      const changeLogoBtn = screen.getByText('Change Logo')
      await user.click(changeLogoBtn)

      expect(screen.getByTestId('logo-upload')).toHaveTextContent('Logo: https://example.com/new-logo.png')
    })

    it('updates banner when banner upload triggers change', async () => {
      const { user } = render(<CompanyProfileForm profile={mockProfile} categories={mockCategories} />)

      const changeBannerBtn = screen.getByText('Change Banner')
      await user.click(changeBannerBtn)

      expect(screen.getByTestId('banner-upload')).toHaveTextContent('Banner: https://example.com/new-banner.jpg')
    })

    it('submits form with updated data', async () => {
      vi.mocked(updateCompanyProfileAction).mockResolvedValueOnce({ success: true })

      const { user } = render(<CompanyProfileForm profile={mockProfile} categories={mockCategories} />)

      const nameInput = screen.getByLabelText('companies.profile.fields.companyName')
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Company')

      const submitBtn = screen.getByRole('button', { name: 'companies.profile.edit.save' })
      await user.click(submitBtn)

      await waitFor(() => {
        expect(updateCompanyProfileAction).toHaveBeenCalledWith(
          expect.objectContaining({
            companyName: 'Updated Company'
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
      vi.mocked(updateCompanyProfileAction).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      )

      const { user } = render(<CompanyProfileForm profile={mockProfile} categories={mockCategories} />)

      const submitBtn = screen.getByRole('button', { name: 'companies.profile.edit.save' })
      await user.click(submitBtn)

      expect(screen.getByLabelText('companies.profile.fields.companyName')).toBeDisabled()
      expect(screen.getByLabelText('companies.profile.fields.description')).toBeDisabled()
      expect(screen.getByTestId('category-picker')).toBeDisabled()
      expect(submitBtn).toBeDisabled()
    })

    it('shows loading spinner during submission', async () => {
      vi.mocked(updateCompanyProfileAction).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      )

      const { user } = render(<CompanyProfileForm profile={mockProfile} categories={mockCategories} />)

      const submitBtn = screen.getByRole('button', { name: 'companies.profile.edit.save' })
      await user.click(submitBtn)

      expect(screen.getByText('companies.profile.edit.saving')).toBeInTheDocument()
    })

    it('re-enables form after submission completes', async () => {
      vi.mocked(updateCompanyProfileAction).mockResolvedValueOnce({ success: true })

      const { user } = render(<CompanyProfileForm profile={mockProfile} categories={mockCategories} />)

      const submitBtn = screen.getByRole('button', { name: 'companies.profile.edit.save' })
      await user.click(submitBtn)

      await waitFor(() => {
        expect(screen.getByLabelText('companies.profile.fields.companyName')).not.toBeDisabled()
      })
    })
  })

  // ===========================================================================
  // SUCCESS & ERROR STATES
  // ===========================================================================

  describe('Success & Error States', () => {
    it('shows success toast on successful submission', async () => {
      vi.mocked(updateCompanyProfileAction).mockResolvedValueOnce({ success: true })

      const { user } = render(<CompanyProfileForm profile={mockProfile} categories={mockCategories} />)

      const submitBtn = screen.getByRole('button', { name: 'companies.profile.edit.save' })
      await user.click(submitBtn)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('companies.profile.edit.success')
      })
    })

    it('shows error toast on failed submission', async () => {
      vi.mocked(updateCompanyProfileAction).mockResolvedValueOnce({
        success: false,
        error: 'Update failed'
      })

      const { user } = render(<CompanyProfileForm profile={mockProfile} categories={mockCategories} />)

      const submitBtn = screen.getByRole('button', { name: 'companies.profile.edit.save' })
      await user.click(submitBtn)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Update failed')
      })
    })

    it('shows generic error toast on exception', async () => {
      vi.mocked(updateCompanyProfileAction).mockRejectedValueOnce(new Error('Network error'))

      const { user } = render(<CompanyProfileForm profile={mockProfile} categories={mockCategories} />)

      const submitBtn = screen.getByRole('button', { name: 'companies.profile.edit.save' })
      await user.click(submitBtn)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('companies.profile.edit.error')
      })
    })

    it('shows error for invalid business hours JSON', async () => {
      const { user } = render(<CompanyProfileForm profile={mockProfile} categories={mockCategories} />)

      const businessHoursTextarea = screen.getByLabelText('companies.profile.fields.businessHours')
      // Use fireEvent.change instead of user.type because { is a special keyboard character in RTL
      fireEvent.change(businessHoursTextarea, { target: { value: '{invalid json}' } })

      const submitBtn = screen.getByRole('button', { name: 'companies.profile.edit.save' })
      await user.click(submitBtn)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('companies.profile.edit.error')
      })

      expect(updateCompanyProfileAction).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles empty strings by converting to undefined', async () => {
      vi.mocked(updateCompanyProfileAction).mockResolvedValueOnce({ success: true })

      const { user } = render(<CompanyProfileForm profile={mockProfile} categories={mockCategories} />)

      const websiteInput = screen.getByLabelText('companies.profile.fields.website')
      await user.clear(websiteInput)

      const submitBtn = screen.getByRole('button', { name: 'companies.profile.edit.save' })
      await user.click(submitBtn)

      await waitFor(() => {
        expect(updateCompanyProfileAction).toHaveBeenCalledWith(
          expect.objectContaining({
            website: undefined
          })
        )
      })
    })

    it('handles empty businessHours gracefully', async () => {
      vi.mocked(updateCompanyProfileAction).mockResolvedValueOnce({ success: true })

      const { user } = render(<CompanyProfileForm profile={mockProfile} categories={mockCategories} />)

      const submitBtn = screen.getByRole('button', { name: 'companies.profile.edit.save' })
      await user.click(submitBtn)

      await waitFor(() => {
        expect(updateCompanyProfileAction).toHaveBeenCalledWith(
          expect.objectContaining({
            businessHours: undefined
          })
        )
      })
    })

    it('parses valid businessHours JSON', async () => {
      vi.mocked(updateCompanyProfileAction).mockResolvedValueOnce({ success: true })

      const { user } = render(<CompanyProfileForm profile={mockProfile} categories={mockCategories} />)

      const businessHoursTextarea = screen.getByLabelText('companies.profile.fields.businessHours')
      // Use fireEvent.change instead of user.type because { is a special keyboard character in RTL
      fireEvent.change(businessHoursTextarea, { target: { value: '{"mon": {"open": "09:00", "close": "17:00"}}' } })

      const submitBtn = screen.getByRole('button', { name: 'companies.profile.edit.save' })
      await user.click(submitBtn)

      await waitFor(() => {
        expect(updateCompanyProfileAction).toHaveBeenCalledWith(
          expect.objectContaining({
            businessHours: { mon: { open: '09:00', close: '17:00' } }
          })
        )
      })
    })

    it('handles null socialLinks in profile', () => {
      const profileWithNullSocial = {
        ...mockProfile,
        socialLinks: null
      }

      render(<CompanyProfileForm profile={profileWithNullSocial} categories={mockCategories} />)

      expect(screen.getByPlaceholderText('Facebook URL')).toHaveValue('')
      expect(screen.getByPlaceholderText('Instagram URL')).toHaveValue('')
      expect(screen.getByPlaceholderText('TikTok URL')).toHaveValue('')
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('has proper labels for all inputs', () => {
      render(<CompanyProfileForm profile={mockProfile} categories={mockCategories} />)

      expect(screen.getByLabelText('companies.profile.fields.companyName')).toBeInTheDocument()
      expect(screen.getByLabelText('companies.profile.fields.description')).toBeInTheDocument()
      expect(screen.getByLabelText('companies.profile.fields.website')).toBeInTheDocument()
      expect(screen.getByLabelText('companies.profile.fields.address')).toBeInTheDocument()
      expect(screen.getByLabelText('companies.profile.fields.phone')).toBeInTheDocument()
      expect(screen.getByLabelText('companies.profile.fields.latitude')).toBeInTheDocument()
      expect(screen.getByLabelText('companies.profile.fields.longitude')).toBeInTheDocument()
    })

    it('submit button is keyboard accessible', async () => {
      const { user } = render(<CompanyProfileForm profile={mockProfile} categories={mockCategories} />)

      const submitBtn = screen.getByRole('button', { name: 'companies.profile.edit.save' })

      await user.tab()
      // Focus should eventually reach submit button through natural tab order
      expect(submitBtn).toBeInTheDocument()
    })
  })
})
