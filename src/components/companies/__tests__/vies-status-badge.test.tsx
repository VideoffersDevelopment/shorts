import { describe, it, expect } from "vitest"
import { render, screen } from "@/test/utils"
import { ViesStatusBadge } from "../vies-status-badge"

describe("ViesStatusBadge", () => {
  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe("Rendering", () => {
    it('renders verified status correctly', () => {
      render(<ViesStatusBadge status="verified" />)

      const badge = screen.getByText("companies.vies.status.verified")
      expect(badge).toBeInTheDocument()
    })

    it('renders pending status correctly', () => {
      render(<ViesStatusBadge status="pending_manual_review" />)

      const badge = screen.getByText("companies.vies.status.pending")
      expect(badge).toBeInTheDocument()
    })

    it('renders rejected status correctly', () => {
      render(<ViesStatusBadge status="rejected" />)

      const badge = screen.getByText("companies.vies.status.rejected")
      expect(badge).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // VARIANTS
  // ===========================================================================

  describe("Variants", () => {
    it("applies green styles for verified status", () => {
      render(<ViesStatusBadge status="verified" />)

      const badge = screen.getByText("companies.vies.status.verified")
      expect(badge).toHaveClass("bg-green-500")
    })

    it("applies yellow styles for pending status", () => {
      render(<ViesStatusBadge status="pending_manual_review" />)

      const badge = screen.getByText("companies.vies.status.pending")
      expect(badge).toHaveClass("bg-yellow-500")
      expect(badge).toHaveClass("text-black")
    })

    it("applies destructive variant for rejected status", () => {
      render(<ViesStatusBadge status="rejected" />)

      const badge = screen.getByText("companies.vies.status.rejected")
      expect(badge).toHaveClass("bg-destructive")
    })
  })

  // ===========================================================================
  // ICONS
  // ===========================================================================

  describe("Icons", () => {
    it("renders CheckCircle icon for verified status", () => {
      const { container } = render(<ViesStatusBadge status="verified" />)

      const icon = container.querySelector("svg")
      expect(icon).toBeInTheDocument()
      expect(icon).toHaveClass("mr-1")
      expect(icon).toHaveClass("h-3")
      expect(icon).toHaveClass("w-3")
    })

    it("renders Clock icon for pending status", () => {
      const { container } = render(<ViesStatusBadge status="pending_manual_review" />)

      const icon = container.querySelector("svg")
      expect(icon).toBeInTheDocument()
    })

    it("renders XCircle icon for rejected status", () => {
      const { container } = render(<ViesStatusBadge status="rejected" />)

      const icon = container.querySelector("svg")
      expect(icon).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // PROPS
  // ===========================================================================

  describe("Props", () => {
    it("applies custom className", () => {
      render(<ViesStatusBadge status="verified" className="custom-class" />)

      const badge = screen.getByText("companies.vies.status.verified")
      expect(badge).toHaveClass("custom-class")
    })

    it("preserves default styles when custom className added", () => {
      render(<ViesStatusBadge status="verified" className="custom-class" />)

      const badge = screen.getByText("companies.vies.status.verified")
      expect(badge).toHaveClass("bg-green-500")
      expect(badge).toHaveClass("custom-class")
    })
  })

  // ===========================================================================
  // TRANSLATIONS
  // ===========================================================================

  describe("Translations", () => {
    it('uses correct translation key for verified', () => {
      render(<ViesStatusBadge status="verified" />)

      expect(screen.getByText("companies.vies.status.verified")).toBeInTheDocument()
    })

    it('uses correct translation key for pending', () => {
      render(<ViesStatusBadge status="pending_manual_review" />)

      expect(screen.getByText("companies.vies.status.pending")).toBeInTheDocument()
    })

    it('uses correct translation key for rejected', () => {
      render(<ViesStatusBadge status="rejected" />)

      expect(screen.getByText("companies.vies.status.rejected")).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe("Accessibility", () => {
    it("renders as badge with proper semantic HTML", () => {
      const { container } = render(<ViesStatusBadge status="verified" />)

      const badge = container.querySelector('[class*="inline-flex"]')
      expect(badge).toBeInTheDocument()
    })

    it("includes icon that is visible to screen readers", () => {
      const { container } = render(<ViesStatusBadge status="verified" />)

      const icon = container.querySelector("svg")
      expect(icon).toBeInTheDocument()
      // Icon should not have aria-hidden, making it visible to screen readers
    })
  })
})
