import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@/test/utils"
import { CompanyUpgradeForm } from "../company-upgrade-form"
import { upgradeToCompanyAction } from "@/app/actions/companies/upgrade"
import type { CompanyProfile } from "@prisma/client"

// Mock dependencies
vi.mock("@/app/actions/companies/upgrade")
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useParams: () => ({
    locale: "en",
  }),
}))

const mockUpgradeToCompanyAction = vi.mocked(upgradeToCompanyAction)

describe("CompanyUpgradeForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe("Rendering", () => {
    it("renders all form fields", () => {
      render(<CompanyUpgradeForm />)

      expect(screen.getByLabelText(/companies.upgrade.fields.companyName/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/companies.upgrade.fields.nip/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/companies.upgrade.fields.address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/companies.upgrade.fields.phone/i)).toBeInTheDocument()
    })

    it("renders form title and subtitle", () => {
      render(<CompanyUpgradeForm />)

      expect(screen.getByText("companies.upgrade.title")).toBeInTheDocument()
      expect(screen.getByText("companies.upgrade.subtitle")).toBeInTheDocument()
    })

    it("renders submit button", () => {
      render(<CompanyUpgradeForm />)

      expect(screen.getByRole("button", { name: /companies.upgrade.submit/i })).toBeInTheDocument()
    })

    it("does NOT render contactEmail field (removed from spec)", () => {
      render(<CompanyUpgradeForm />)

      expect(screen.queryByLabelText(/contactEmail/i)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // FIELD ATTRIBUTES
  // ===========================================================================

  describe("Field attributes", () => {
    it("companyName has correct attributes", () => {
      render(<CompanyUpgradeForm />)

      const input = screen.getByLabelText(/companies.upgrade.fields.companyName/i)
      expect(input).toHaveAttribute("name", "companyName")
      expect(input).toHaveAttribute("required")
      expect(input).toHaveAttribute("minLength", "2")
      expect(input).toHaveAttribute("maxLength", "100")
    })

    it("nip has correct attributes", () => {
      render(<CompanyUpgradeForm />)

      const input = screen.getByLabelText(/companies.upgrade.fields.nip/i)
      expect(input).toHaveAttribute("name", "nip")
      expect(input).toHaveAttribute("required")
      expect(input).toHaveAttribute("pattern", "\\d{10}|\\d{2}-\\d{3}-\\d{3}-\\d{2}")
    })

    it("address has correct attributes", () => {
      render(<CompanyUpgradeForm />)

      const input = screen.getByLabelText(/companies.upgrade.fields.address/i)
      expect(input).toHaveAttribute("name", "address")
      expect(input).toHaveAttribute("required")
      expect(input).toHaveAttribute("minLength", "5")
      expect(input).toHaveAttribute("maxLength", "200")
    })

    it("phone is optional (no required attribute)", () => {
      render(<CompanyUpgradeForm />)

      const input = screen.getByLabelText(/companies.upgrade.fields.phone/i)
      expect(input).toHaveAttribute("name", "phone")
      expect(input).toHaveAttribute("type", "tel")
      expect(input).not.toHaveAttribute("required")
    })
  })

  // ===========================================================================
  // PLACEHOLDERS & HINTS
  // ===========================================================================

  describe("Placeholders and hints", () => {
    it("shows placeholders for required fields", () => {
      render(<CompanyUpgradeForm />)

      expect(screen.getByPlaceholderText("companies.upgrade.placeholders.companyName")).toBeInTheDocument()
      expect(screen.getByPlaceholderText("1234567890")).toBeInTheDocument()
      expect(screen.getByPlaceholderText("companies.upgrade.placeholders.address")).toBeInTheDocument()
      expect(screen.getByPlaceholderText("companies.upgrade.placeholders.phone")).toBeInTheDocument()
    })

    it("shows hint for NIP field", () => {
      render(<CompanyUpgradeForm />)

      expect(screen.getByText("companies.upgrade.hints.nip")).toBeInTheDocument()
    })

    it("shows hint for phone field", () => {
      render(<CompanyUpgradeForm />)

      expect(screen.getByText("companies.upgrade.hints.phone")).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // INTERACTIONS
  // ===========================================================================

  describe("User interactions", () => {
    it("allows typing in all fields", async () => {
      const { user } = render(<CompanyUpgradeForm />)

      const companyNameInput = screen.getByLabelText(/companies.upgrade.fields.companyName/i)
      const nipInput = screen.getByLabelText(/companies.upgrade.fields.nip/i)
      const addressInput = screen.getByLabelText(/companies.upgrade.fields.address/i)
      const phoneInput = screen.getByLabelText(/companies.upgrade.fields.phone/i)

      await user.type(companyNameInput, "Test Company")
      await user.type(nipInput, "1234567890")
      await user.type(addressInput, "Test Street 123")
      await user.type(phoneInput, "+48123456789")

      expect(companyNameInput).toHaveValue("Test Company")
      expect(nipInput).toHaveValue("1234567890")
      expect(addressInput).toHaveValue("Test Street 123")
      expect(phoneInput).toHaveValue("+48123456789")
    })

    it("submits form with entered values", async () => {
      const mockCompany: CompanyProfile = {
        id: "company-1",
        userId: "user-1",
        companyName: "Test Company",
        slug: "test-company",
        nip: "1234567890",
        street: "Test Street 123",
        postalCode: null,
        city: null,
        phone: "+48123456789",
        viesVerified: true,
        verifiedAt: new Date(),
        verifiedBy: null,
        description: null,
        website: null,
        categoryId: null,
        subcategories: null,
        socialLinks: null,
        logo: null,
        banner: null,
        latitude: null,
        longitude: null,
        businessHours: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockUpgradeToCompanyAction.mockResolvedValue({
        success: true,
        data: {
          company: mockCompany,
          viesStatus: "verified",
        },
      })

      const { user } = render(<CompanyUpgradeForm />)

      await user.type(screen.getByLabelText(/companies.upgrade.fields.companyName/i), "Test Company")
      await user.type(screen.getByLabelText(/companies.upgrade.fields.nip/i), "1234567890")
      await user.type(screen.getByLabelText(/companies.upgrade.fields.address/i), "Test Street 123")
      await user.type(screen.getByLabelText(/companies.upgrade.fields.phone/i), "+48123456789")

      await user.click(screen.getByRole("button", { name: /companies.upgrade.submit/i }))

      await waitFor(() => {
        expect(mockUpgradeToCompanyAction).toHaveBeenCalledWith({
          companyName: "Test Company",
          nip: "1234567890",
          address: "Test Street 123",
          phone: "+48123456789",
        })
      })
    })

    it("submits form without optional phone field", async () => {
      const mockCompany: CompanyProfile = {
        id: "company-1",
        userId: "user-1",
        companyName: "Test Company",
        slug: "test-company",
        nip: "1234567890",
        street: "Test Street 123",
        postalCode: null,
        city: null,
        phone: null,
        viesVerified: true,
        verifiedAt: new Date(),
        verifiedBy: null,
        description: null,
        website: null,
        categoryId: null,
        subcategories: null,
        socialLinks: null,
        logo: null,
        banner: null,
        latitude: null,
        longitude: null,
        businessHours: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockUpgradeToCompanyAction.mockResolvedValue({
        success: true,
        data: {
          company: mockCompany,
          viesStatus: "verified",
        },
      })

      const { user } = render(<CompanyUpgradeForm />)

      await user.type(screen.getByLabelText(/companies.upgrade.fields.companyName/i), "Test Company")
      await user.type(screen.getByLabelText(/companies.upgrade.fields.nip/i), "1234567890")
      await user.type(screen.getByLabelText(/companies.upgrade.fields.address/i), "Test Street 123")

      await user.click(screen.getByRole("button", { name: /companies.upgrade.submit/i }))

      await waitFor(() => {
        expect(mockUpgradeToCompanyAction).toHaveBeenCalledWith({
          companyName: "Test Company",
          nip: "1234567890",
          address: "Test Street 123",
          phone: "",
        })
      })
    })
  })

  // ===========================================================================
  // LOADING STATE
  // ===========================================================================

  describe("Loading state", () => {
    it("shows loading spinner when submitting", async () => {
      mockUpgradeToCompanyAction.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  success: true,
                  data: {
                    company: {} as CompanyProfile,
                    viesStatus: "verified",
                  },
                }),
              1000
            )
          })
      )

      const { user } = render(<CompanyUpgradeForm />)

      await user.type(screen.getByLabelText(/companies.upgrade.fields.companyName/i), "Test Company")
      await user.type(screen.getByLabelText(/companies.upgrade.fields.nip/i), "1234567890")
      await user.type(screen.getByLabelText(/companies.upgrade.fields.address/i), "Test Street 123")

      await user.click(screen.getByRole("button", { name: /companies.upgrade.submit/i }))

      expect(screen.getByText("companies.upgrade.submitting")).toBeInTheDocument()
      expect(screen.getByRole("button")).toBeDisabled()
    })

    it("disables all inputs when loading", async () => {
      mockUpgradeToCompanyAction.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  success: true,
                  data: {
                    company: {} as CompanyProfile,
                    viesStatus: "verified",
                  },
                }),
              1000
            )
          })
      )

      const { user } = render(<CompanyUpgradeForm />)

      await user.type(screen.getByLabelText(/companies.upgrade.fields.companyName/i), "Test Company")
      await user.type(screen.getByLabelText(/companies.upgrade.fields.nip/i), "1234567890")
      await user.type(screen.getByLabelText(/companies.upgrade.fields.address/i), "Test Street 123")

      await user.click(screen.getByRole("button", { name: /companies.upgrade.submit/i }))

      expect(screen.getByLabelText(/companies.upgrade.fields.companyName/i)).toBeDisabled()
      expect(screen.getByLabelText(/companies.upgrade.fields.nip/i)).toBeDisabled()
      expect(screen.getByLabelText(/companies.upgrade.fields.address/i)).toBeDisabled()
      expect(screen.getByLabelText(/companies.upgrade.fields.phone/i)).toBeDisabled()
    })
  })

  // ===========================================================================
  // ERROR STATE
  // ===========================================================================

  describe("Error state", () => {
    it("shows error message when submission fails", async () => {
      mockUpgradeToCompanyAction.mockResolvedValue({
        success: false,
        error: "companies.errors.nipExists",
        code: "NIP_EXISTS",
        field: "nip",
      })

      const { user } = render(<CompanyUpgradeForm />)

      await user.type(screen.getByLabelText(/companies.upgrade.fields.companyName/i), "Test Company")
      await user.type(screen.getByLabelText(/companies.upgrade.fields.nip/i), "1234567890")
      await user.type(screen.getByLabelText(/companies.upgrade.fields.address/i), "Test Street 123")

      await user.click(screen.getByRole("button", { name: /companies.upgrade.submit/i }))

      await waitFor(() => {
        expect(screen.getByText("companies.companies.errors.nipExists")).toBeInTheDocument()
      })
    })

    it("clears error when submitting again", async () => {
      mockUpgradeToCompanyAction
        .mockResolvedValueOnce({
          success: false,
          error: "companies.errors.nipExists",
          code: "NIP_EXISTS",
        })
        .mockResolvedValueOnce({
          success: true,
          data: {
            company: {} as CompanyProfile,
            viesStatus: "verified",
          },
        })

      const { user } = render(<CompanyUpgradeForm />)

      await user.type(screen.getByLabelText(/companies.upgrade.fields.companyName/i), "Test Company")
      await user.type(screen.getByLabelText(/companies.upgrade.fields.nip/i), "1234567890")
      await user.type(screen.getByLabelText(/companies.upgrade.fields.address/i), "Test Street 123")

      await user.click(screen.getByRole("button", { name: /companies.upgrade.submit/i }))

      await waitFor(() => {
        expect(screen.getByText("companies.companies.errors.nipExists")).toBeInTheDocument()
      })

      await user.clear(screen.getByLabelText(/companies.upgrade.fields.nip/i))
      await user.type(screen.getByLabelText(/companies.upgrade.fields.nip/i), "9876543210")
      await user.click(screen.getByRole("button", { name: /companies.upgrade.submit/i }))

      await waitFor(() => {
        expect(screen.queryByText("companies.companies.errors.nipExists")).not.toBeInTheDocument()
      })
    })

    it("re-enables form inputs after error", async () => {
      mockUpgradeToCompanyAction.mockResolvedValue({
        success: false,
        error: "companies.errors.nipExists",
        code: "NIP_EXISTS",
      })

      const { user } = render(<CompanyUpgradeForm />)

      await user.type(screen.getByLabelText(/companies.upgrade.fields.companyName/i), "Test Company")
      await user.type(screen.getByLabelText(/companies.upgrade.fields.nip/i), "1234567890")
      await user.type(screen.getByLabelText(/companies.upgrade.fields.address/i), "Test Street 123")

      await user.click(screen.getByRole("button", { name: /companies.upgrade.submit/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/companies.upgrade.fields.companyName/i)).not.toBeDisabled()
        expect(screen.getByLabelText(/companies.upgrade.fields.nip/i)).not.toBeDisabled()
      })
    })
  })

  // ===========================================================================
  // SUCCESS STATE
  // ===========================================================================

  describe("Success state", () => {
    it("shows success screen with verified status", async () => {
      const mockCompany: CompanyProfile = {
        id: "company-1",
        userId: "user-1",
        companyName: "Test Company",
        slug: "test-company",
        nip: "1234567890",
        street: "Test Street 123",
        postalCode: null,
        city: null,
        phone: null,
        viesVerified: true,
        verifiedAt: new Date(),
        verifiedBy: null,
        description: null,
        website: null,
        categoryId: null,
        subcategories: null,
        socialLinks: null,
        logo: null,
        banner: null,
        latitude: null,
        longitude: null,
        businessHours: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockUpgradeToCompanyAction.mockResolvedValue({
        success: true,
        data: {
          company: mockCompany,
          viesStatus: "verified",
        },
      })

      const { user } = render(<CompanyUpgradeForm />)

      await user.type(screen.getByLabelText(/companies.upgrade.fields.companyName/i), "Test Company")
      await user.type(screen.getByLabelText(/companies.upgrade.fields.nip/i), "1234567890")
      await user.type(screen.getByLabelText(/companies.upgrade.fields.address/i), "Test Street 123")

      await user.click(screen.getByRole("button", { name: /companies.upgrade.submit/i }))

      await waitFor(() => {
        expect(screen.getByText("companies.upgrade.success.title")).toBeInTheDocument()
        expect(screen.getByText("companies.upgrade.success.verified")).toBeInTheDocument()
        expect(screen.getByText("companies.vies.status.verified")).toBeInTheDocument()
      })
    })

    it("shows success screen with pending status", async () => {
      const mockCompany: CompanyProfile = {
        id: "company-1",
        userId: "user-1",
        companyName: "Test Company",
        slug: "test-company",
        nip: "1234567890",
        street: "Test Street 123",
        postalCode: null,
        city: null,
        phone: null,
        viesVerified: false,
        verifiedAt: null,
        verifiedBy: null,
        description: null,
        website: null,
        categoryId: null,
        subcategories: null,
        socialLinks: null,
        logo: null,
        banner: null,
        latitude: null,
        longitude: null,
        businessHours: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockUpgradeToCompanyAction.mockResolvedValue({
        success: true,
        data: {
          company: mockCompany,
          viesStatus: "pending_manual_review",
        },
      })

      const { user } = render(<CompanyUpgradeForm />)

      await user.type(screen.getByLabelText(/companies.upgrade.fields.companyName/i), "Test Company")
      await user.type(screen.getByLabelText(/companies.upgrade.fields.nip/i), "1234567890")
      await user.type(screen.getByLabelText(/companies.upgrade.fields.address/i), "Test Street 123")

      await user.click(screen.getByRole("button", { name: /companies.upgrade.submit/i }))

      await waitFor(() => {
        expect(screen.getByText("companies.upgrade.success.title")).toBeInTheDocument()
        expect(screen.getByText("companies.upgrade.success.pending")).toBeInTheDocument()
        expect(screen.getByText("companies.vies.status.pending")).toBeInTheDocument()
      })
    })

    it("shows continue button on success", async () => {
      const mockCompany: CompanyProfile = {
        id: "company-1",
        userId: "user-1",
        companyName: "Test Company",
        slug: "test-company",
        nip: "1234567890",
        street: "Test Street 123",
        postalCode: null,
        city: null,
        phone: null,
        viesVerified: true,
        verifiedAt: new Date(),
        verifiedBy: null,
        description: null,
        website: null,
        categoryId: null,
        subcategories: null,
        socialLinks: null,
        logo: null,
        banner: null,
        latitude: null,
        longitude: null,
        businessHours: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockUpgradeToCompanyAction.mockResolvedValue({
        success: true,
        data: {
          company: mockCompany,
          viesStatus: "verified",
        },
      })

      const { user } = render(<CompanyUpgradeForm />)

      await user.type(screen.getByLabelText(/companies.upgrade.fields.companyName/i), "Test Company")
      await user.type(screen.getByLabelText(/companies.upgrade.fields.nip/i), "1234567890")
      await user.type(screen.getByLabelText(/companies.upgrade.fields.address/i), "Test Street 123")

      await user.click(screen.getByRole("button", { name: /companies.upgrade.submit/i }))

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /companies.upgrade.success.continueButton/i })).toBeInTheDocument()
      })
    })

    it("hides form after successful submission", async () => {
      const mockCompany: CompanyProfile = {
        id: "company-1",
        userId: "user-1",
        companyName: "Test Company",
        slug: "test-company",
        nip: "1234567890",
        street: "Test Street 123",
        postalCode: null,
        city: null,
        phone: null,
        viesVerified: true,
        verifiedAt: new Date(),
        verifiedBy: null,
        description: null,
        website: null,
        categoryId: null,
        subcategories: null,
        socialLinks: null,
        logo: null,
        banner: null,
        latitude: null,
        longitude: null,
        businessHours: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockUpgradeToCompanyAction.mockResolvedValue({
        success: true,
        data: {
          company: mockCompany,
          viesStatus: "verified",
        },
      })

      const { user } = render(<CompanyUpgradeForm />)

      await user.type(screen.getByLabelText(/companies.upgrade.fields.companyName/i), "Test Company")
      await user.type(screen.getByLabelText(/companies.upgrade.fields.nip/i), "1234567890")
      await user.type(screen.getByLabelText(/companies.upgrade.fields.address/i), "Test Street 123")

      await user.click(screen.getByRole("button", { name: /companies.upgrade.submit/i }))

      await waitFor(() => {
        expect(screen.queryByLabelText(/companies.upgrade.fields.companyName/i)).not.toBeInTheDocument()
        expect(screen.queryByRole("button", { name: /companies.upgrade.submit/i })).not.toBeInTheDocument()
      })
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe("Accessibility", () => {
    it("has proper form structure", () => {
      const { container } = render(<CompanyUpgradeForm />)

      const form = container.querySelector("form")
      expect(form).toBeInTheDocument()
    })

    it("labels are associated with inputs", () => {
      render(<CompanyUpgradeForm />)

      const companyNameLabel = screen.getByText("companies.upgrade.fields.companyName")
      const nipLabel = screen.getByText("companies.upgrade.fields.nip")
      const addressLabel = screen.getByText("companies.upgrade.fields.address")
      const phoneLabel = screen.getByText("companies.upgrade.fields.phone")

      expect(companyNameLabel).toBeInTheDocument()
      expect(nipLabel).toBeInTheDocument()
      expect(addressLabel).toBeInTheDocument()
      expect(phoneLabel).toBeInTheDocument()
    })

    it("error messages have proper ARIA roles", async () => {
      mockUpgradeToCompanyAction.mockResolvedValue({
        success: false,
        error: "companies.errors.nipExists",
        code: "NIP_EXISTS",
      })

      const { user } = render(<CompanyUpgradeForm />)

      await user.type(screen.getByLabelText(/companies.upgrade.fields.companyName/i), "Test Company")
      await user.type(screen.getByLabelText(/companies.upgrade.fields.nip/i), "1234567890")
      await user.type(screen.getByLabelText(/companies.upgrade.fields.address/i), "Test Street 123")

      await user.click(screen.getByRole("button", { name: /companies.upgrade.submit/i }))

      await waitFor(() => {
        const alert = screen.getByRole("alert")
        expect(alert).toBeInTheDocument()
      })
    })
  })
})
