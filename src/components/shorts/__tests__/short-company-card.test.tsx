import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@/test/utils"
import { ShortCompanyCard } from "../short-company-card"

// ===========================================================================
// MOCKS
// ===========================================================================

vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  )
}))

// ===========================================================================
// TEST DATA
// ===========================================================================

const mockCompany = {
  id: "company-123",
  companyName: "Test Company",
  slug: "test-company",
  logo: "https://example.com/logo.png",
  city: "Warsaw",
  categoryId: "cat-1",
  category: {
    id: "cat-1",
    name: "Technology",
    slug: "technology"
  }
}

const mockCompanyWithoutLogo = {
  ...mockCompany,
  logo: null
}

const mockCompanyWithoutCategory = {
  ...mockCompany,
  category: null
}

const mockCompanyWithoutCity = {
  ...mockCompany,
  city: null
}

describe("ShortCompanyCard Component", () => {
  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe("Rendering", () => {
    it("renders company name", () => {
      // Act
      render(
        <ShortCompanyCard
          company={mockCompany}
          locale="en"
          viewProfileLabel="View Profile"
        />
      )

      // Assert
      expect(screen.getByText("Test Company")).toBeInTheDocument()
    })

    it("renders company logo when provided", () => {
      // Act
      render(
        <ShortCompanyCard
          company={mockCompany}
          locale="en"
          viewProfileLabel="View Profile"
        />
      )

      // Assert
      const logo = screen.getByAltText("Test Company")
      expect(logo).toBeInTheDocument()
      expect(logo.getAttribute("src")).toBe("https://example.com/logo.png")
    })

    it("renders placeholder icon when no logo", () => {
      // Act
      const { container } = render(
        <ShortCompanyCard
          company={mockCompanyWithoutLogo}
          locale="en"
          viewProfileLabel="View Profile"
        />
      )

      // Assert - Should have Building2 icon (SVG)
      expect(screen.queryByAltText("Test Company")).not.toBeInTheDocument()
      const icon = container.querySelector("svg")
      expect(icon).toBeInTheDocument()
    })

    it("renders category when provided", () => {
      // Act
      render(
        <ShortCompanyCard
          company={mockCompany}
          locale="en"
          viewProfileLabel="View Profile"
        />
      )

      // Assert
      expect(screen.getByText("Technology")).toBeInTheDocument()
    })

    it("does not render category when not provided", () => {
      // Act
      render(
        <ShortCompanyCard
          company={mockCompanyWithoutCategory}
          locale="en"
          viewProfileLabel="View Profile"
        />
      )

      // Assert
      expect(screen.queryByText("Technology")).not.toBeInTheDocument()
    })

    it("renders city when provided", () => {
      // Act
      render(
        <ShortCompanyCard
          company={mockCompany}
          locale="en"
          viewProfileLabel="View Profile"
        />
      )

      // Assert
      expect(screen.getByText("Warsaw")).toBeInTheDocument()
    })

    it("does not render city when not provided", () => {
      // Act
      render(
        <ShortCompanyCard
          company={mockCompanyWithoutCity}
          locale="en"
          viewProfileLabel="View Profile"
        />
      )

      // Assert
      expect(screen.queryByText("Warsaw")).not.toBeInTheDocument()
    })

    it("renders view profile button", () => {
      // Act
      render(
        <ShortCompanyCard
          company={mockCompany}
          locale="en"
          viewProfileLabel="View Profile"
        />
      )

      // Assert
      expect(screen.getByRole("link", { name: /view profile/i })).toBeInTheDocument()
    })

    it("renders with custom view profile label", () => {
      // Act
      render(
        <ShortCompanyCard
          company={mockCompany}
          locale="pl"
          viewProfileLabel="Zobacz profil"
        />
      )

      // Assert
      expect(screen.getByRole("link", { name: /zobacz profil/i })).toBeInTheDocument()
    })

    it("applies company-card class", () => {
      // Act
      const { container } = render(
        <ShortCompanyCard
          company={mockCompany}
          locale="en"
          viewProfileLabel="View Profile"
        />
      )

      // Assert
      expect(container.querySelector(".company-card")).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // LINK BEHAVIOR
  // ===========================================================================

  describe("Link Behavior", () => {
    it("links to correct company profile URL with locale", () => {
      // Act
      render(
        <ShortCompanyCard
          company={mockCompany}
          locale="en"
          viewProfileLabel="View Profile"
        />
      )

      // Assert
      const link = screen.getByRole("link")
      expect(link.getAttribute("href")).toBe("/en/companies/test-company")
    })

    it("uses correct locale in URL", () => {
      // Act
      render(
        <ShortCompanyCard
          company={mockCompany}
          locale="pl"
          viewProfileLabel="View Profile"
        />
      )

      // Assert
      const link = screen.getByRole("link")
      expect(link.getAttribute("href")).toBe("/pl/companies/test-company")
    })

    it("uses company slug in URL", () => {
      // Act
      const companyWithDifferentSlug = {
        ...mockCompany,
        slug: "different-slug"
      }
      render(
        <ShortCompanyCard
          company={companyWithDifferentSlug}
          locale="en"
          viewProfileLabel="View Profile"
        />
      )

      // Assert
      const link = screen.getByRole("link")
      expect(link.getAttribute("href")).toBe("/en/companies/different-slug")
    })
  })

  // ===========================================================================
  // ICONS
  // ===========================================================================

  describe("Icons", () => {
    it("renders MapPin icon with city", () => {
      // Act
      const { container } = render(
        <ShortCompanyCard
          company={mockCompany}
          locale="en"
          viewProfileLabel="View Profile"
        />
      )

      // Assert - MapPin icon should be in city section
      const citySection = screen.getByText("Warsaw").closest("p")
      expect(citySection?.querySelector("svg")).toBeInTheDocument()
    })

    it("renders ExternalLink icon in button", () => {
      // Act
      const { container } = render(
        <ShortCompanyCard
          company={mockCompany}
          locale="en"
          viewProfileLabel="View Profile"
        />
      )

      // Assert
      const link = screen.getByRole("link")
      expect(link.querySelector("svg")).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe("Edge Cases", () => {
    it("handles long company name", () => {
      // Act
      const longNameCompany = {
        ...mockCompany,
        companyName: "Very Long Company Name That Should Be Truncated Properly"
      }
      render(
        <ShortCompanyCard
          company={longNameCompany}
          locale="en"
          viewProfileLabel="View Profile"
        />
      )

      // Assert
      expect(screen.getByText("Very Long Company Name That Should Be Truncated Properly")).toBeInTheDocument()
    })

    it("handles long category name", () => {
      // Act
      const longCategoryCompany = {
        ...mockCompany,
        category: {
          id: "cat-1",
          name: "Very Long Category Name That Should Be Truncated",
          slug: "long-category"
        }
      }
      render(
        <ShortCompanyCard
          company={longCategoryCompany}
          locale="en"
          viewProfileLabel="View Profile"
        />
      )

      // Assert
      expect(screen.getByText("Very Long Category Name That Should Be Truncated")).toBeInTheDocument()
    })

    it("handles long city name", () => {
      // Act
      const longCityCompany = {
        ...mockCompany,
        city: "Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogoch"
      }
      render(
        <ShortCompanyCard
          company={longCityCompany}
          locale="en"
          viewProfileLabel="View Profile"
        />
      )

      // Assert
      expect(screen.getByText("Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogoch")).toBeInTheDocument()
    })

    it("handles special characters in company name", () => {
      // Act
      const specialNameCompany = {
        ...mockCompany,
        companyName: "Test & Company <Sp. z o.o.>"
      }
      render(
        <ShortCompanyCard
          company={specialNameCompany}
          locale="en"
          viewProfileLabel="View Profile"
        />
      )

      // Assert
      expect(screen.getByText("Test & Company <Sp. z o.o.>")).toBeInTheDocument()
    })

    it("handles empty city string as falsy", () => {
      // Act
      const emptyCityCompany = {
        ...mockCompany,
        city: ""
      }
      render(
        <ShortCompanyCard
          company={emptyCityCompany}
          locale="en"
          viewProfileLabel="View Profile"
        />
      )

      // Assert - Empty string is falsy, so city section should not render
      expect(screen.queryByText("Warsaw")).not.toBeInTheDocument()
    })

    it("handles all optional fields missing", () => {
      // Act
      const minimalCompany = {
        id: "company-123",
        companyName: "Minimal Company",
        slug: "minimal-company",
        logo: null,
        city: null,
        categoryId: null,
        category: null
      }
      render(
        <ShortCompanyCard
          company={minimalCompany}
          locale="en"
          viewProfileLabel="View Profile"
        />
      )

      // Assert
      expect(screen.getByText("Minimal Company")).toBeInTheDocument()
      expect(screen.getByRole("link")).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe("Accessibility", () => {
    it("logo image has alt text", () => {
      // Act
      render(
        <ShortCompanyCard
          company={mockCompany}
          locale="en"
          viewProfileLabel="View Profile"
        />
      )

      // Assert
      expect(screen.getByAltText("Test Company")).toBeInTheDocument()
    })

    it("link is accessible", () => {
      // Act
      render(
        <ShortCompanyCard
          company={mockCompany}
          locale="en"
          viewProfileLabel="View Profile"
        />
      )

      // Assert
      const link = screen.getByRole("link")
      expect(link).toBeVisible()
    })

    it("link has visible label text", () => {
      // Act
      render(
        <ShortCompanyCard
          company={mockCompany}
          locale="en"
          viewProfileLabel="View Profile"
        />
      )

      // Assert
      expect(screen.getByRole("link", { name: /view profile/i })).toBeVisible()
    })

    it("company name is visible", () => {
      // Act
      render(
        <ShortCompanyCard
          company={mockCompany}
          locale="en"
          viewProfileLabel="View Profile"
        />
      )

      // Assert
      expect(screen.getByText("Test Company")).toBeVisible()
    })
  })
})
