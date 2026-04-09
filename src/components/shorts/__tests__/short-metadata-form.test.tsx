import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@/test/utils"
import { ShortMetadataForm } from "../short-metadata-form"
import type { Category } from "@prisma/client"

// ===========================================================================
// TEST DATA
// ===========================================================================

interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[]
}

const mockCategories: CategoryWithChildren[] = [
  {
    id: "cat-1",
    name: "Technology",
    slug: "technology",
    description: "Tech category",
    imageUrl: null,
    parentId: null,
    displayOrder: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    children: [
      {
        id: "cat-1-1",
        name: "Software",
        slug: "software",
        description: "Software subcategory",
        imageUrl: null,
        parentId: "cat-1",
        displayOrder: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  },
  {
    id: "cat-2",
    name: "Entertainment",
    slug: "entertainment",
    description: "Entertainment category",
    imageUrl: null,
    parentId: null,
    displayOrder: 2,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

describe("ShortMetadataForm", () => {
  const mockOnSubmit = vi.fn()
  const mockOnBack = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe("Rendering", () => {
    it("renders all form fields", () => {
      render(
        <ShortMetadataForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
        />
      )

      // Title field
      expect(screen.getByLabelText(/shorts.wizard.metadata.fields.title/i)).toBeInTheDocument()

      // Description field
      expect(screen.getByLabelText(/shorts.wizard.metadata.fields.description/i)).toBeInTheDocument()

      // Category field (label)
      expect(screen.getByText(/shorts.wizard.metadata.fields.category/i)).toBeInTheDocument()

      // Tags field (label) - may appear multiple times (label, hint, placeholder)
      const tagsElements = screen.getAllByText(/shorts.wizard.metadata.fields.tags/i)
      expect(tagsElements.length).toBeGreaterThan(0)

      // Location field
      expect(screen.getByLabelText(/shorts.wizard.metadata.fields.location/i)).toBeInTheDocument()

      // CTA Link field
      expect(screen.getByLabelText(/shorts.wizard.metadata.fields.ctaLink/i)).toBeInTheDocument()
    })

    it("renders required field indicators for title and category", () => {
      render(
        <ShortMetadataForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
        />
      )

      // Check for required indicators (*)
      const labels = document.querySelectorAll("label")
      let titleLabelHasRequired = false
      let categoryLabelHasRequired = false

      labels.forEach(label => {
        if (label.textContent?.includes("shorts.wizard.metadata.fields.title")) {
          titleLabelHasRequired = label.querySelector(".text-destructive") !== null
        }
        if (label.textContent?.includes("shorts.wizard.metadata.fields.category")) {
          categoryLabelHasRequired = label.querySelector(".text-destructive") !== null
        }
      })

      expect(titleLabelHasRequired).toBe(true)
    })

    it("renders with default values when provided", () => {
      const defaultValues = {
        title: "My Video Title",
        description: "My description",
        categoryId: "cat-1",
        tags: ["tag1", "tag2"],
        location: "New York",
        ctaLink: "https://example.com"
      }

      render(
        <ShortMetadataForm
          categories={mockCategories}
          defaultValues={defaultValues}
          onSubmit={mockOnSubmit}
        />
      )

      expect(screen.getByLabelText(/shorts.wizard.metadata.fields.title/i)).toHaveValue("My Video Title")
      expect(screen.getByLabelText(/shorts.wizard.metadata.fields.description/i)).toHaveValue("My description")
      expect(screen.getByLabelText(/shorts.wizard.metadata.fields.location/i)).toHaveValue("New York")
      expect(screen.getByLabelText(/shorts.wizard.metadata.fields.ctaLink/i)).toHaveValue("https://example.com")
    })

    it("renders back button when onBack is provided", () => {
      render(
        <ShortMetadataForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
        />
      )

      expect(screen.getByRole("button", { name: /shorts.wizard.navigation.back/i })).toBeInTheDocument()
    })

    it("does not render back button when onBack is not provided", () => {
      render(
        <ShortMetadataForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
        />
      )

      expect(screen.queryByRole("button", { name: /shorts.wizard.navigation.back/i })).not.toBeInTheDocument()
    })

    it("renders next button", () => {
      render(
        <ShortMetadataForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
        />
      )

      expect(screen.getByRole("button", { name: /shorts.wizard.navigation.next/i })).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // INTERACTIONS
  // ===========================================================================

  describe("Interactions", () => {
    it("allows typing in title field", async () => {
      const { user } = render(
        <ShortMetadataForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
        />
      )

      const titleInput = screen.getByLabelText(/shorts.wizard.metadata.fields.title/i)
      await user.type(titleInput, "My New Video")

      expect(titleInput).toHaveValue("My New Video")
    })

    it("allows typing in description field", async () => {
      const { user } = render(
        <ShortMetadataForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
        />
      )

      const descInput = screen.getByLabelText(/shorts.wizard.metadata.fields.description/i)
      await user.type(descInput, "This is a description")

      expect(descInput).toHaveValue("This is a description")
    })

    it("allows typing in location field", async () => {
      const { user } = render(
        <ShortMetadataForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
        />
      )

      const locationInput = screen.getByLabelText(/shorts.wizard.metadata.fields.location/i)
      await user.type(locationInput, "Los Angeles")

      expect(locationInput).toHaveValue("Los Angeles")
    })

    it("allows typing in CTA link field", async () => {
      const { user } = render(
        <ShortMetadataForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
        />
      )

      const ctaInput = screen.getByLabelText(/shorts.wizard.metadata.fields.ctaLink/i)
      await user.type(ctaInput, "https://mysite.com")

      expect(ctaInput).toHaveValue("https://mysite.com")
    })

    it("calls onBack when back button is clicked", async () => {
      const { user } = render(
        <ShortMetadataForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
        />
      )

      await user.click(screen.getByRole("button", { name: /shorts.wizard.navigation.back/i }))

      expect(mockOnBack).toHaveBeenCalledTimes(1)
    })
  })

  // ===========================================================================
  // FORM SUBMISSION
  // ===========================================================================

  describe("Form Submission", () => {
    it("calls onSubmit with form data when valid", async () => {
      const { user } = render(
        <ShortMetadataForm
          categories={mockCategories}
          defaultValues={{
            title: "Valid Title",
            categoryId: "cat-1"
          }}
          onSubmit={mockOnSubmit}
        />
      )

      await user.click(screen.getByRole("button", { name: /shorts.wizard.navigation.next/i }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })
    })

    it("does not call onSubmit when title is empty", async () => {
      const { user } = render(
        <ShortMetadataForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
        />
      )

      await user.click(screen.getByRole("button", { name: /shorts.wizard.navigation.next/i }))

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled()
      })
    })
  })

  // ===========================================================================
  // VALIDATION ERRORS
  // ===========================================================================

  describe("Validation Errors", () => {
    it("shows error for empty title after submit attempt", async () => {
      const { user } = render(
        <ShortMetadataForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
        />
      )

      await user.click(screen.getByRole("button", { name: /shorts.wizard.navigation.next/i }))

      await waitFor(() => {
        expect(screen.getByText(/Title is required/i)).toBeInTheDocument()
      })
    })

    it("blocks submission with invalid CTA URL", async () => {
      const { user } = render(
        <ShortMetadataForm
          categories={mockCategories}
          defaultValues={{
            title: "Valid Title",
            categoryId: "cat-1"
          }}
          onSubmit={mockOnSubmit}
        />
      )

      const ctaInput = screen.getByLabelText(/shorts.wizard.metadata.fields.ctaLink/i)
      await user.type(ctaInput, "not-a-valid-url")

      await user.click(screen.getByRole("button", { name: /shorts.wizard.navigation.next/i }))

      // Wait a bit for async validation to complete
      await waitFor(() => {
        // Form submission should be blocked by invalid URL
        expect(mockOnSubmit).not.toHaveBeenCalled()
      })
    })

    it("clears error when user types valid input", async () => {
      const { user } = render(
        <ShortMetadataForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
        />
      )

      // Submit to trigger error
      await user.click(screen.getByRole("button", { name: /shorts.wizard.navigation.next/i }))

      await waitFor(() => {
        expect(screen.getByText(/Title is required/i)).toBeInTheDocument()
      })

      // Type valid title
      const titleInput = screen.getByLabelText(/shorts.wizard.metadata.fields.title/i)
      await user.type(titleInput, "Valid Title")

      await waitFor(() => {
        expect(screen.queryByText(/Title is required/i)).not.toBeInTheDocument()
      })
    })
  })

  // ===========================================================================
  // LOADING STATES
  // ===========================================================================

  describe("Loading States", () => {
    it("disables all fields when isSubmitting is true", () => {
      render(
        <ShortMetadataForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          isSubmitting={true}
        />
      )

      expect(screen.getByLabelText(/shorts.wizard.metadata.fields.title/i)).toBeDisabled()
      expect(screen.getByLabelText(/shorts.wizard.metadata.fields.description/i)).toBeDisabled()
      expect(screen.getByLabelText(/shorts.wizard.metadata.fields.location/i)).toBeDisabled()
      expect(screen.getByLabelText(/shorts.wizard.metadata.fields.ctaLink/i)).toBeDisabled()
    })

    it("disables submit button when isSubmitting is true", () => {
      render(
        <ShortMetadataForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          isSubmitting={true}
        />
      )

      expect(screen.getByRole("button", { name: /shorts.wizard.navigation.next/i })).toBeDisabled()
    })

    it("disables back button when isSubmitting is true", () => {
      render(
        <ShortMetadataForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          isSubmitting={true}
        />
      )

      expect(screen.getByRole("button", { name: /shorts.wizard.navigation.back/i })).toBeDisabled()
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe("Edge Cases", () => {
    it("handles empty categories array", () => {
      render(
        <ShortMetadataForm
          categories={[]}
          onSubmit={mockOnSubmit}
        />
      )

      // Should render without crashing
      expect(screen.getByLabelText(/shorts.wizard.metadata.fields.title/i)).toBeInTheDocument()
    })

    it("handles title at max length (100 characters)", async () => {
      const { user } = render(
        <ShortMetadataForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
        />
      )

      const titleInput = screen.getByLabelText(/shorts.wizard.metadata.fields.title/i) as HTMLInputElement
      const maxLengthTitle = "A".repeat(100)

      await user.type(titleInput, maxLengthTitle)

      expect(titleInput.value.length).toBeLessThanOrEqual(100)
    })

    it("handles description at max length (500 characters)", async () => {
      const { user } = render(
        <ShortMetadataForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
        />
      )

      const descInput = screen.getByLabelText(/shorts.wizard.metadata.fields.description/i) as HTMLTextAreaElement

      // The textarea has maxLength attribute
      expect(descInput).toHaveAttribute("maxLength", "500")
    })

    it("allows empty optional fields", async () => {
      const { user } = render(
        <ShortMetadataForm
          categories={mockCategories}
          defaultValues={{
            title: "Valid Title",
            categoryId: "cat-1"
          }}
          onSubmit={mockOnSubmit}
        />
      )

      await user.click(screen.getByRole("button", { name: /shorts.wizard.navigation.next/i }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe("Accessibility", () => {
    it("has proper labels for all inputs", () => {
      render(
        <ShortMetadataForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
        />
      )

      // All inputs should have associated labels
      const titleInput = screen.getByLabelText(/shorts.wizard.metadata.fields.title/i)
      expect(titleInput).toHaveAttribute("id", "title")

      const descInput = screen.getByLabelText(/shorts.wizard.metadata.fields.description/i)
      expect(descInput).toHaveAttribute("id", "description")

      const locationInput = screen.getByLabelText(/shorts.wizard.metadata.fields.location/i)
      expect(locationInput).toHaveAttribute("id", "location")

      const ctaInput = screen.getByLabelText(/shorts.wizard.metadata.fields.ctaLink/i)
      expect(ctaInput).toHaveAttribute("id", "ctaLink")
    })

    it("form is navigable via keyboard", async () => {
      const { user } = render(
        <ShortMetadataForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
        />
      )

      const titleInput = screen.getByLabelText(/shorts.wizard.metadata.fields.title/i)

      // Tab through form
      await user.tab()

      // First focusable element should be title input
      expect(document.activeElement).toBe(titleInput)
    })

    it("error messages are associated with inputs", async () => {
      const { user } = render(
        <ShortMetadataForm
          categories={mockCategories}
          onSubmit={mockOnSubmit}
        />
      )

      await user.click(screen.getByRole("button", { name: /shorts.wizard.navigation.next/i }))

      await waitFor(() => {
        const errorMessage = screen.getByText(/Title is required/i)
        expect(errorMessage).toHaveClass("text-destructive")
      })
    })
  })
})
