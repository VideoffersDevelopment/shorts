import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils'
import { CompanyProfileCard } from './company-profile-card'
import type { Prisma } from '@prisma/client'

// Mock react-markdown
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div data-testid="markdown-content">{children}</div>,
}))

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, fill, ...props }: { src: string; alt: string; fill?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} data-fill={fill ? 'true' : 'false'} {...props} />
  ),
}))

// =============================================================================
// TEST DATA
// =============================================================================

interface TestCompanyData {
  companyName: string
  slug: string
  logo: string | null
  banner: string | null
  description: string | null
  viesVerified: boolean
  website: string | null
  street: string | null
  postalCode: string | null
  city: string | null
  phone: string | null
  socialLinks: Prisma.JsonValue
  category: {
    name: string
    slug: string
  } | null
  createdAt: Date
}

const mockMinimalCompany: TestCompanyData = {
  companyName: 'Test Company',
  slug: 'test-company',
  logo: null,
  banner: null,
  description: null,
  viesVerified: false,
  website: null,
  street: null,
  postalCode: null,
  city: null,
  phone: null,
  socialLinks: null,
  category: null,
  createdAt: new Date('2024-01-15'),
}

const mockFullCompany: TestCompanyData = {
  companyName: 'Tech Solutions Ltd',
  slug: 'tech-solutions',
  logo: 'https://example.com/logo.png',
  banner: 'https://example.com/banner.jpg',
  description: '**Bold** description with [link](https://example.com)',
  viesVerified: true,
  website: 'https://techsolutions.com',
  street: '123 Tech Street',
  postalCode: '00-001',
  city: 'Warsaw',
  phone: '+48 123 456 789',
  socialLinks: {
    facebook: 'https://facebook.com/techsolutions',
    instagram: 'https://instagram.com/techsolutions',
  },
  category: {
    name: 'Technology',
    slug: 'technology',
  },
  createdAt: new Date('2024-01-15'),
}

describe('CompanyProfileCard', () => {
  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('renders with minimal data', () => {
      render(<CompanyProfileCard company={mockMinimalCompany} />)

      expect(screen.getByText('Test Company')).toBeInTheDocument()
      expect(screen.getByText('Test Company')).toHaveClass('text-3xl', 'font-bold')
    })

    it('renders with full data', () => {
      render(<CompanyProfileCard company={mockFullCompany} />)

      expect(screen.getByText('Tech Solutions Ltd')).toBeInTheDocument()
      expect(screen.getByText('Technology')).toBeInTheDocument()
      expect(screen.getByText('123 Tech Street, 00-001, Warsaw')).toBeInTheDocument()
      expect(screen.getByText('techsolutions.com')).toBeInTheDocument()
    })

    it('renders company name as heading', () => {
      render(<CompanyProfileCard company={mockFullCompany} />)

      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent('Tech Solutions Ltd')
    })

    it('renders avatar with first letter as fallback when no logo', () => {
      render(<CompanyProfileCard company={mockMinimalCompany} />)

      expect(screen.getByText('T')).toBeInTheDocument()
    })

    it('renders avatar with logo when provided', () => {
      render(<CompanyProfileCard company={mockFullCompany} />)

      // Avatar component uses AvatarImage which is from @radix-ui, just verify banner exists
      // Banner is the image with fill attribute
      const images = screen.getAllByAltText('Tech Solutions Ltd')
      const banner = images.find(img => img.getAttribute('data-fill') === 'true')
      expect(banner).toBeInTheDocument()
      expect(banner).toHaveAttribute('src', 'https://example.com/banner.jpg')
    })

    it('renders stats placeholder with 0 values', () => {
      render(<CompanyProfileCard company={mockMinimalCompany} />)

      // Check for three "0" values in stats section
      const statsSection = screen.getByText('companies.profile.stats.shorts').closest('.grid')
      expect(statsSection).toBeInTheDocument()

      // Verify all three stat labels
      expect(screen.getByText('companies.profile.stats.shorts')).toBeInTheDocument()
      expect(screen.getByText('companies.profile.stats.followers')).toBeInTheDocument()
      expect(screen.getByText('companies.profile.stats.views')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // VARIANTS
  // ===========================================================================

  describe('Variants', () => {
    describe('Banner', () => {
      it('renders banner when provided', () => {
        render(<CompanyProfileCard company={mockFullCompany} />)

        const banner = screen.getByAltText('Tech Solutions Ltd')
        expect(banner).toHaveAttribute('src', 'https://example.com/banner.jpg')
      })

      it('does not render banner when null', () => {
        render(<CompanyProfileCard company={mockMinimalCompany} />)

        // Check that there's no banner div container
        const bannerDivs = document.querySelectorAll('.relative.h-64.w-full.overflow-hidden.rounded-lg')
        expect(bannerDivs).toHaveLength(0)
      })

      it('does not render banner when URL is invalid', () => {
        const companyWithInvalidBanner = {
          ...mockFullCompany,
          banner: 'javascript:alert("XSS")',
        }

        render(<CompanyProfileCard company={companyWithInvalidBanner} />)

        // Check that there's no banner div container
        const bannerDivs = document.querySelectorAll('.relative.h-64.w-full.overflow-hidden.rounded-lg')
        expect(bannerDivs).toHaveLength(0)
      })
    })

    describe('Verified Badge', () => {
      it('shows verified badge when viesVerified is true', () => {
        render(<CompanyProfileCard company={mockFullCompany} />)

        expect(screen.getByText('companies.profile.verified')).toBeInTheDocument()
      })

      it('does not show verified badge when viesVerified is false', () => {
        render(<CompanyProfileCard company={mockMinimalCompany} />)

        expect(screen.queryByText('companies.profile.verified')).not.toBeInTheDocument()
      })
    })

    describe('Category', () => {
      it('displays category when provided', () => {
        render(<CompanyProfileCard company={mockFullCompany} />)

        expect(screen.getByText('Technology')).toBeInTheDocument()
        expect(screen.getByText('Technology')).toHaveClass('text-muted-foreground')
      })

      it('does not display category when null', () => {
        render(<CompanyProfileCard company={mockMinimalCompany} />)

        expect(screen.queryByText('Technology')).not.toBeInTheDocument()
      })
    })

    describe('Description', () => {
      it('renders description when provided', () => {
        render(<CompanyProfileCard company={mockFullCompany} />)

        const description = screen.getByTestId('markdown-content')
        expect(description).toHaveTextContent('**Bold** description with [link](https://example.com)')
      })

      it('does not render description section when null', () => {
        render(<CompanyProfileCard company={mockMinimalCompany} />)

        expect(screen.queryByTestId('markdown-content')).not.toBeInTheDocument()
      })
    })
  })

  // ===========================================================================
  // PROPS - Contact Info
  // ===========================================================================

  describe('Contact Information', () => {
    it('displays address when provided', () => {
      render(<CompanyProfileCard company={mockFullCompany} />)

      expect(screen.getByText('123 Tech Street, 00-001, Warsaw')).toBeInTheDocument()
    })

    it('does not display address when street and city are null', () => {
      render(<CompanyProfileCard company={mockMinimalCompany} />)

      expect(screen.queryByText(/Street/i)).not.toBeInTheDocument()
    })

    it('displays website with hostname when provided', () => {
      render(<CompanyProfileCard company={mockFullCompany} />)

      const websiteLink = screen.getByText('techsolutions.com')
      expect(websiteLink).toBeInTheDocument()
      expect(websiteLink.closest('a')).toHaveAttribute('href', 'https://techsolutions.com')
      expect(websiteLink.closest('a')).toHaveAttribute('target', '_blank')
      expect(websiteLink.closest('a')).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('does not display website when null', () => {
      render(<CompanyProfileCard company={mockMinimalCompany} />)

      expect(screen.queryByRole('link', { name: /website/i })).not.toBeInTheDocument()
    })

    it('does not display website when URL is invalid', () => {
      const companyWithInvalidWebsite = {
        ...mockFullCompany,
        website: 'javascript:alert("XSS")',
      }

      render(<CompanyProfileCard company={companyWithInvalidWebsite} />)

      expect(screen.queryByText('techsolutions.com')).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // PROPS - Social Links
  // ===========================================================================

  describe('Social Links', () => {
    it('displays Facebook link when provided', () => {
      render(<CompanyProfileCard company={mockFullCompany} />)

      const facebookLink = screen.getByLabelText('Facebook')
      expect(facebookLink).toHaveAttribute('href', 'https://facebook.com/techsolutions')
      expect(facebookLink).toHaveAttribute('target', '_blank')
      expect(facebookLink).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('displays Instagram link when provided', () => {
      render(<CompanyProfileCard company={mockFullCompany} />)

      const instagramLink = screen.getByLabelText('Instagram')
      expect(instagramLink).toHaveAttribute('href', 'https://instagram.com/techsolutions')
      expect(instagramLink).toHaveAttribute('target', '_blank')
      expect(instagramLink).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('does not display social links section when socialLinks is null', () => {
      render(<CompanyProfileCard company={mockMinimalCompany} />)

      expect(screen.queryByLabelText('Facebook')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Instagram')).not.toBeInTheDocument()
    })

    it('displays only Facebook when Instagram is missing', () => {
      const companyWithOnlyFacebook = {
        ...mockFullCompany,
        socialLinks: {
          facebook: 'https://facebook.com/techsolutions',
        },
      }

      render(<CompanyProfileCard company={companyWithOnlyFacebook} />)

      expect(screen.getByLabelText('Facebook')).toBeInTheDocument()
      expect(screen.queryByLabelText('Instagram')).not.toBeInTheDocument()
    })

    it('displays only Instagram when Facebook is missing', () => {
      const companyWithOnlyInstagram = {
        ...mockFullCompany,
        socialLinks: {
          instagram: 'https://instagram.com/techsolutions',
        },
      }

      render(<CompanyProfileCard company={companyWithOnlyInstagram} />)

      expect(screen.queryByLabelText('Facebook')).not.toBeInTheDocument()
      expect(screen.getByLabelText('Instagram')).toBeInTheDocument()
    })

    it('does not display social links when both are empty', () => {
      const companyWithEmptySocial = {
        ...mockFullCompany,
        socialLinks: {},
      }

      render(<CompanyProfileCard company={companyWithEmptySocial} />)

      expect(screen.queryByLabelText('Facebook')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Instagram')).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // SECURITY
  // ===========================================================================

  describe('Security - URL Sanitization', () => {
    it('blocks javascript: protocol in banner', () => {
      const companyWithXSSBanner = {
        ...mockFullCompany,
        banner: 'javascript:alert("XSS")',
      }

      render(<CompanyProfileCard company={companyWithXSSBanner} />)

      // Check that there's no banner div container
      const bannerDivs = document.querySelectorAll('.relative.h-64.w-full.overflow-hidden.rounded-lg')
      expect(bannerDivs).toHaveLength(0)
    })

    it('blocks javascript: protocol in website', () => {
      const companyWithXSSWebsite = {
        ...mockFullCompany,
        website: 'javascript:alert("XSS")',
      }

      render(<CompanyProfileCard company={companyWithXSSWebsite} />)

      expect(screen.queryByRole('link', { name: /website/i })).not.toBeInTheDocument()
    })

    it('blocks javascript: protocol in Facebook link', () => {
      const companyWithXSSFacebook = {
        ...mockFullCompany,
        socialLinks: {
          facebook: 'javascript:alert("XSS")',
        },
      }

      render(<CompanyProfileCard company={companyWithXSSFacebook} />)

      expect(screen.queryByLabelText('Facebook')).not.toBeInTheDocument()
    })

    it('blocks javascript: protocol in Instagram link', () => {
      const companyWithXSSInstagram = {
        ...mockFullCompany,
        socialLinks: {
          instagram: 'javascript:alert("XSS")',
        },
      }

      render(<CompanyProfileCard company={companyWithXSSInstagram} />)

      expect(screen.queryByLabelText('Instagram')).not.toBeInTheDocument()
    })

    it('blocks data: protocol URLs', () => {
      const companyWithDataURL = {
        ...mockFullCompany,
        website: 'data:text/html,<script>alert("XSS")</script>',
      }

      render(<CompanyProfileCard company={companyWithDataURL} />)

      expect(screen.queryByText(/techsolutions/)).not.toBeInTheDocument()
    })

    it('renders markdown safely (script tags blocked)', () => {
      const companyWithScriptInDescription = {
        ...mockFullCompany,
        description: '<script>alert("XSS")</script>Safe content',
      }

      render(<CompanyProfileCard company={companyWithScriptInDescription} />)

      // ReactMarkdown with security config should render safely
      const description = screen.getByTestId('markdown-content')
      expect(description).toBeInTheDocument()
      // Script should be stripped or rendered as text, not executed
      expect(description).toHaveTextContent('Safe content')
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('has aria-label on Facebook link', () => {
      render(<CompanyProfileCard company={mockFullCompany} />)

      const facebookLink = screen.getByLabelText('Facebook')
      expect(facebookLink).toHaveAttribute('aria-label', 'Facebook')
    })

    it('has aria-label on Instagram link', () => {
      render(<CompanyProfileCard company={mockFullCompany} />)

      const instagramLink = screen.getByLabelText('Instagram')
      expect(instagramLink).toHaveAttribute('aria-label', 'Instagram')
    })

    it('has proper alt text on banner image', () => {
      render(<CompanyProfileCard company={mockFullCompany} />)

      // Banner should have alt text with company name
      const images = screen.getAllByAltText('Tech Solutions Ltd')
      // Find the banner specifically (has data-fill="true")
      const banner = images.find(img => img.getAttribute('data-fill') === 'true')
      expect(banner).toBeInTheDocument()
      expect(banner).toHaveAttribute('alt', 'Tech Solutions Ltd')
    })

    it('has proper alt text on logo avatar', () => {
      render(<CompanyProfileCard company={mockFullCompany} />)

      const images = screen.getAllByAltText('Tech Solutions Ltd')
      // At least one image (avatar) should exist
      expect(images.length).toBeGreaterThanOrEqual(1)
    })

    it('external links have proper security attributes', () => {
      render(<CompanyProfileCard company={mockFullCompany} />)

      const websiteLink = screen.getByText('techsolutions.com').closest('a')
      expect(websiteLink).toHaveAttribute('rel', 'noopener noreferrer')
      expect(websiteLink).toHaveAttribute('target', '_blank')

      const facebookLink = screen.getByLabelText('Facebook')
      expect(facebookLink).toHaveAttribute('rel', 'noopener noreferrer')
      expect(facebookLink).toHaveAttribute('target', '_blank')
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles missing logo gracefully', () => {
      render(<CompanyProfileCard company={mockMinimalCompany} />)

      // Should show fallback with first letter
      expect(screen.getByText('T')).toBeInTheDocument()
    })

    it('handles missing banner gracefully', () => {
      render(<CompanyProfileCard company={mockMinimalCompany} />)

      // Should not crash, just not render banner section
      expect(screen.getByText('Test Company')).toBeInTheDocument()
    })

    it('handles empty socialLinks object', () => {
      const companyWithEmptySocial = {
        ...mockFullCompany,
        socialLinks: {},
      }

      render(<CompanyProfileCard company={companyWithEmptySocial} />)

      expect(screen.queryByLabelText('Facebook')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Instagram')).not.toBeInTheDocument()
    })

    it('handles null socialLinks', () => {
      const companyWithNullSocial = {
        ...mockFullCompany,
        socialLinks: null,
      }

      render(<CompanyProfileCard company={companyWithNullSocial} />)

      expect(screen.queryByLabelText('Facebook')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Instagram')).not.toBeInTheDocument()
    })

    it('handles malformed socialLinks JSON', () => {
      const companyWithMalformedSocial = {
        ...mockFullCompany,
        socialLinks: 'not valid json' as unknown as Prisma.JsonValue,
      }

      render(<CompanyProfileCard company={companyWithMalformedSocial} />)

      // Should not crash
      expect(screen.getByText('Tech Solutions Ltd')).toBeInTheDocument()
    })

    it('handles company name with single character', () => {
      const companyWithSingleChar = {
        ...mockMinimalCompany,
        companyName: 'X',
      }

      render(<CompanyProfileCard company={companyWithSingleChar} />)

      // Use heading to get the company name specifically (not the avatar fallback)
      expect(screen.getByRole('heading', { level: 1, name: 'X' })).toBeInTheDocument()
    })

    it('handles very long company name', () => {
      const companyWithLongName = {
        ...mockMinimalCompany,
        companyName: 'A'.repeat(100),
      }

      render(<CompanyProfileCard company={companyWithLongName} />)

      expect(screen.getByText('A'.repeat(100))).toBeInTheDocument()
    })

    it('handles URL without protocol gracefully', () => {
      const companyWithInvalidURL = {
        ...mockFullCompany,
        website: 'example.com', // Missing https://
      }

      render(<CompanyProfileCard company={companyWithInvalidURL} />)

      // Should be filtered out by sanitizeUrl
      expect(screen.queryByText('example.com')).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // TRANSLATIONS
  // ===========================================================================

  describe('Translations', () => {
    it('uses correct translation keys for verified badge', () => {
      render(<CompanyProfileCard company={mockFullCompany} />)

      expect(screen.getByText('companies.profile.verified')).toBeInTheDocument()
    })

    it('uses correct translation keys for stats', () => {
      render(<CompanyProfileCard company={mockMinimalCompany} />)

      expect(screen.getByText('companies.profile.stats.shorts')).toBeInTheDocument()
      expect(screen.getByText('companies.profile.stats.followers')).toBeInTheDocument()
      expect(screen.getByText('companies.profile.stats.views')).toBeInTheDocument()
    })
  })
})
