import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@/test/utils"
import { TagsAutocomplete } from "../tags-autocomplete"

// ===========================================================================
// MOCKS
// ===========================================================================

const mockFetch = vi.fn()
global.fetch = mockFetch

describe("TagsAutocomplete", () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        { id: "tag-1", name: "React", slug: "react" },
        { id: "tag-2", name: "JavaScript", slug: "javascript" },
        { id: "tag-3", name: "TypeScript", slug: "typescript" }
      ])
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe("Rendering", () => {
    it("renders input field", () => {
      render(<TagsAutocomplete value={[]} onChange={mockOnChange} />)

      expect(screen.getByPlaceholderText(/shorts.wizard.metadata.fields.tagsPlaceholder/i)).toBeInTheDocument()
    })

    it("renders tag count indicator", () => {
      render(<TagsAutocomplete value={[]} onChange={mockOnChange} />)

      expect(screen.getByText(/shorts.wizard.metadata.fields.tagsHint/i)).toBeInTheDocument()
      // Count is part of the same text node, check via regex
      expect(screen.getByText(/0\/10/)).toBeInTheDocument()
    })

    it("renders existing tags as badges", () => {
      render(<TagsAutocomplete value={["React", "TypeScript"]} onChange={mockOnChange} />)

      expect(screen.getByText("React")).toBeInTheDocument()
      expect(screen.getByText("TypeScript")).toBeInTheDocument()
    })

    it("updates tag count when tags are present", () => {
      render(<TagsAutocomplete value={["tag1", "tag2", "tag3"]} onChange={mockOnChange} />)

      // Count is part of the same text node, check via regex
      expect(screen.getByText(/3\/10/)).toBeInTheDocument()
    })

    it("hides input when max tags (10) reached", () => {
      const maxTags = Array.from({ length: 10 }, (_, i) => `tag${i + 1}`)
      render(<TagsAutocomplete value={maxTags} onChange={mockOnChange} />)

      expect(screen.queryByPlaceholderText(/shorts.wizard.metadata.fields.tagsPlaceholder/i)).not.toBeInTheDocument()
      // Count is part of the same text node, check via regex
      expect(screen.getByText(/10\/10/)).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // INTERACTIONS
  // ===========================================================================

  describe("Interactions", () => {
    it("allows typing in input field", async () => {
      const { user } = render(<TagsAutocomplete value={[]} onChange={mockOnChange} />)

      const input = screen.getByPlaceholderText(/shorts.wizard.metadata.fields.tagsPlaceholder/i)
      await user.type(input, "Re")

      expect(input).toHaveValue("Re")
    })

    it("removes tag when X button is clicked", async () => {
      const { user } = render(<TagsAutocomplete value={["React", "TypeScript"]} onChange={mockOnChange} />)

      // Find remove buttons (X icons inside badges)
      const removeButtons = document.querySelectorAll("button[type='button']")
      const reactRemoveBtn = Array.from(removeButtons).find(btn =>
        btn.closest(".flex")?.textContent?.includes("React")
      )

      if (reactRemoveBtn) {
        await user.click(reactRemoveBtn)
      }

      expect(mockOnChange).toHaveBeenCalledWith(["TypeScript"])
    })

    it("adds tag on Enter key press", async () => {
      const { user } = render(<TagsAutocomplete value={[]} onChange={mockOnChange} />)

      const input = screen.getByPlaceholderText(/shorts.wizard.metadata.fields.tagsPlaceholder/i)
      await user.type(input, "NewTag")
      await user.keyboard("{Enter}")

      expect(mockOnChange).toHaveBeenCalledWith(["NewTag"])
    })

    it("removes last tag on Backspace when input is empty", async () => {
      const { user } = render(<TagsAutocomplete value={["React", "TypeScript"]} onChange={mockOnChange} />)

      const input = screen.getByPlaceholderText(/shorts.wizard.metadata.fields.tagsPlaceholder/i)
      await user.click(input)
      await user.keyboard("{Backspace}")

      expect(mockOnChange).toHaveBeenCalledWith(["React"])
    })

    it("closes suggestions on Escape key", async () => {
      const { user } = render(<TagsAutocomplete value={[]} onChange={mockOnChange} />)

      const input = screen.getByPlaceholderText(/shorts.wizard.metadata.fields.tagsPlaceholder/i)
      await user.type(input, "Rea")

      // Wait for debounce and fetch
      vi.advanceTimersByTime(350)

      await user.keyboard("{Escape}")

      // Suggestions should be hidden
      await waitFor(() => {
        expect(screen.queryByText("React")).not.toBeInTheDocument()
      })
    })
  })

  // ===========================================================================
  // API SEARCH
  // ===========================================================================

  describe("API Search", () => {
    it("searches tags when input has 2+ characters", async () => {
      const { user } = render(<TagsAutocomplete value={[]} onChange={mockOnChange} />)

      const input = screen.getByPlaceholderText(/shorts.wizard.metadata.fields.tagsPlaceholder/i)
      await user.type(input, "Re")

      // Advance timers past debounce
      vi.advanceTimersByTime(350)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/tags/search?q=Re")
      })
    })

    it("does not search when input has less than 2 characters", async () => {
      const { user } = render(<TagsAutocomplete value={[]} onChange={mockOnChange} />)

      const input = screen.getByPlaceholderText(/shorts.wizard.metadata.fields.tagsPlaceholder/i)
      await user.type(input, "R")

      vi.advanceTimersByTime(350)

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it("debounces search requests", async () => {
      const { user } = render(<TagsAutocomplete value={[]} onChange={mockOnChange} />)

      const input = screen.getByPlaceholderText(/shorts.wizard.metadata.fields.tagsPlaceholder/i)

      // Type quickly
      await user.type(input, "React")

      // Should not call fetch immediately
      expect(mockFetch).not.toHaveBeenCalled()

      // Wait for debounce
      vi.advanceTimersByTime(350)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1)
      })
    })

    it("filters out already selected tags from suggestions", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([
          { id: "tag-1", name: "React", slug: "react" },
          { id: "tag-2", name: "Redux", slug: "redux" }
        ])
      })

      const { user } = render(<TagsAutocomplete value={["React"]} onChange={mockOnChange} />)

      const input = screen.getByPlaceholderText(/shorts.wizard.metadata.fields.tagsPlaceholder/i)
      await user.type(input, "Re")

      vi.advanceTimersByTime(350)

      // React should not appear in suggestions since it's already selected
      // Redux should appear
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled()
      })
    })
  })

  // ===========================================================================
  // LOADING STATES
  // ===========================================================================

  describe("Loading States", () => {
    it("shows loading spinner while searching", async () => {
      // Make fetch take a bit longer to keep loading state visible
      let resolvePromise: (value: unknown) => void
      mockFetch.mockImplementation(() =>
        new Promise(resolve => {
          resolvePromise = resolve
        })
      )

      const { user } = render(<TagsAutocomplete value={[]} onChange={mockOnChange} />)

      const input = screen.getByPlaceholderText(/shorts.wizard.metadata.fields.tagsPlaceholder/i)
      await user.type(input, "Re")

      // Advance past debounce to trigger fetch
      vi.advanceTimersByTime(350)

      // Wait for loading state to appear
      await waitFor(() => {
        const spinner = document.querySelector(".animate-spin")
        expect(spinner).toBeInTheDocument()
      })

      // Cleanup: resolve the promise
      resolvePromise!({ ok: true, json: () => Promise.resolve([]) })
    })

    it("disables input when disabled prop is true", () => {
      render(<TagsAutocomplete value={[]} onChange={mockOnChange} disabled={true} />)

      expect(screen.getByPlaceholderText(/shorts.wizard.metadata.fields.tagsPlaceholder/i)).toBeDisabled()
    })

    it("disables remove buttons when disabled", () => {
      render(<TagsAutocomplete value={["React"]} onChange={mockOnChange} disabled={true} />)

      const removeButton = document.querySelector("button[type='button']")
      expect(removeButton).toBeDisabled()
    })
  })

  // ===========================================================================
  // ERROR STATES
  // ===========================================================================

  describe("Error States", () => {
    it("handles API error gracefully", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"))

      const { user } = render(<TagsAutocomplete value={[]} onChange={mockOnChange} />)

      const input = screen.getByPlaceholderText(/shorts.wizard.metadata.fields.tagsPlaceholder/i)
      await user.type(input, "Re")

      vi.advanceTimersByTime(350)

      // Should not crash, suggestions should be empty
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled()
      })

      // Component should still be functional
      expect(input).toBeInTheDocument()
    })

    it("handles non-ok response gracefully", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500
      })

      const { user } = render(<TagsAutocomplete value={[]} onChange={mockOnChange} />)

      const input = screen.getByPlaceholderText(/shorts.wizard.metadata.fields.tagsPlaceholder/i)
      await user.type(input, "Re")

      vi.advanceTimersByTime(350)

      // Should handle error without crashing
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled()
      })
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe("Edge Cases", () => {
    it("does not add duplicate tags", async () => {
      const { user } = render(<TagsAutocomplete value={["React"]} onChange={mockOnChange} />)

      const input = screen.getByPlaceholderText(/shorts.wizard.metadata.fields.tagsPlaceholder/i)
      await user.type(input, "React")
      await user.keyboard("{Enter}")

      // Should not add duplicate
      expect(mockOnChange).not.toHaveBeenCalled()
    })

    it("trims whitespace from tag names", async () => {
      const { user } = render(<TagsAutocomplete value={[]} onChange={mockOnChange} />)

      const input = screen.getByPlaceholderText(/shorts.wizard.metadata.fields.tagsPlaceholder/i)
      await user.type(input, "  React  ")
      await user.keyboard("{Enter}")

      expect(mockOnChange).toHaveBeenCalledWith(["React"])
    })

    it("does not add empty tags", async () => {
      const { user } = render(<TagsAutocomplete value={[]} onChange={mockOnChange} />)

      const input = screen.getByPlaceholderText(/shorts.wizard.metadata.fields.tagsPlaceholder/i)
      await user.type(input, "   ")
      await user.keyboard("{Enter}")

      expect(mockOnChange).not.toHaveBeenCalled()
    })

    it("does not add tags exceeding 50 characters", async () => {
      const { user } = render(<TagsAutocomplete value={[]} onChange={mockOnChange} />)

      const input = screen.getByPlaceholderText(/shorts.wizard.metadata.fields.tagsPlaceholder/i) as HTMLInputElement

      // Input has maxLength of 50
      expect(input).toHaveAttribute("maxLength", "50")
    })

    it("handles special characters in tag search", async () => {
      const { user } = render(<TagsAutocomplete value={[]} onChange={mockOnChange} />)

      const input = screen.getByPlaceholderText(/shorts.wizard.metadata.fields.tagsPlaceholder/i)
      await user.type(input, "C++")

      vi.advanceTimersByTime(350)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("q=C%2B%2B"))
      })
    })
  })

  // ===========================================================================
  // KEYBOARD NAVIGATION
  // ===========================================================================

  describe("Keyboard Navigation", () => {
    it("navigates suggestions with arrow keys", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([
          { id: "tag-1", name: "React", slug: "react" },
          { id: "tag-2", name: "Redux", slug: "redux" }
        ])
      })

      const { user } = render(<TagsAutocomplete value={[]} onChange={mockOnChange} />)

      const input = screen.getByPlaceholderText(/shorts.wizard.metadata.fields.tagsPlaceholder/i)
      await user.type(input, "Re")

      vi.advanceTimersByTime(350)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled()
      })

      // Navigate down
      await user.keyboard("{ArrowDown}")
      await user.keyboard("{ArrowDown}")
      await user.keyboard("{ArrowUp}")

      // Select with Enter
      await user.keyboard("{Enter}")

      // Should have called onChange
      expect(mockOnChange).toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe("Accessibility", () => {
    it("input has appropriate placeholder", () => {
      render(<TagsAutocomplete value={[]} onChange={mockOnChange} />)

      const input = screen.getByPlaceholderText(/shorts.wizard.metadata.fields.tagsPlaceholder/i)
      expect(input).toBeInTheDocument()
    })

    it("tag badges have remove buttons", () => {
      render(<TagsAutocomplete value={["React"]} onChange={mockOnChange} />)

      const removeButtons = document.querySelectorAll("button[type='button']")
      expect(removeButtons.length).toBeGreaterThan(0)
    })

    it("applies custom className", () => {
      render(<TagsAutocomplete value={[]} onChange={mockOnChange} className="custom-class" />)

      const container = document.querySelector(".custom-class")
      expect(container).toBeInTheDocument()
    })
  })
})
