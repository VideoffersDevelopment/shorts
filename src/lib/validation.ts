import { z } from "zod"

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters")
})

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
})

export const emailSchema = z.object({
  email: z.string().email("Invalid email address")
})

export const tokenSchema = z.object({
  token: z.string().min(1, "Token is required")
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

export const profileSchema = z.object({
  displayName: z.string().max(100, "Display name too long").optional(),
  bio: z.string().max(500, "Bio too long").optional(),
  location: z.string().max(100, "Location too long").optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  avatar: z.string().url("Invalid avatar URL").optional(),
  darkMode: z.boolean().optional()
})

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

export const deleteAccountSchema = z.object({
  confirmation: z.string().refine((val) => val === "DELETE", {
    message: "Type DELETE to confirm"
  })
})

// ============================================================================
// COMPANY SCHEMAS (Stage 02)
// ============================================================================

// NIP validation (Polish VAT number)
export const nipSchema = z.string()
  .regex(/^\d{10}$|^\d{2}-\d{3}-\d{3}-\d{2}$/, "Invalid NIP format")
  .transform(nip => nip.replace(/-/g, "")) // Normalize to 10 digits

// Company upgrade form
export const companyUpgradeSchema = z.object({
  companyName: z.string().min(2, "Name too short").max(100, "Name too long"),
  nip: nipSchema,
  address: z.string().min(5, "Address too short").max(200, "Address too long"),
  phone: z.string().optional()
})

export type CompanyUpgradeInput = z.infer<typeof companyUpgradeSchema>

// Company signup form (combines user registration + company data)
export const companySignupSchema = z.object({
  // User fields
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  // Company fields
  companyName: z.string().min(2, "Name too short").max(100, "Name too long"),
  nip: nipSchema,
  address: z.string().min(5, "Address too short").max(200, "Address too long"),
  phone: z.string().optional()
})

export type CompanySignupInput = z.infer<typeof companySignupSchema>

// Business hours validation
const dayHoursSchema = z.object({
  open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
}).nullable()

export const businessHoursSchema = z.object({
  monday: dayHoursSchema.optional(),
  tuesday: dayHoursSchema.optional(),
  wednesday: dayHoursSchema.optional(),
  thursday: dayHoursSchema.optional(),
  friday: dayHoursSchema.optional(),
  saturday: dayHoursSchema.optional(),
  sunday: dayHoursSchema.optional(),
})

// Polish postal code validation (XX-XXX format)
export const postalCodeSchema = z.string()
  .regex(/^\d{2}-\d{3}$/, "Nieprawidłowy format kodu pocztowego (XX-XXX)")
  .optional()
  .or(z.literal(""))

// Company profile edit form
export const companyProfileSchema = z.object({
  companyName: z.string().min(2).max(100).optional(),
  description: z.string().max(2000).optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  categoryId: z.string().cuid().optional().or(z.literal("")),
  subcategories: z.array(z.string().cuid()).max(3).optional(),
  socialLinks: z.object({
    facebook: z.string().url().optional().or(z.literal("")),
    instagram: z.string().url().optional().or(z.literal("")),
    tiktok: z.string().url().optional().or(z.literal("")),
    youtube: z.string().url().optional().or(z.literal("")),
    linkedin: z.string().url().optional().or(z.literal(""))
  }).optional(),
  logo: z.string().url().optional().or(z.literal("")),
  banner: z.string().url().optional().or(z.literal("")),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  street: z.string().max(200).optional(),
  postalCode: postalCodeSchema,
  city: z.string().max(100).optional(),
  phone: z.string().optional(),
  contactEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  businessHours: businessHoursSchema.optional()
})

export type CompanyProfileInput = z.infer<typeof companyProfileSchema>

// Category management
export const categorySchema = z.object({
  name: z.string().min(2, "Name too short").max(50, "Name too long"),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Invalid slug format"),
  icon: z.string().optional(),
  // Transform empty string to null, then validate as CUID or null
  parentId: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().cuid().nullable().optional()
  ),
  order: z.number().int().min(0).optional(),
  enabled: z.boolean().optional()
})

export type CategoryInput = z.infer<typeof categorySchema>

// Type exports for form usage
export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type EmailInput = z.infer<typeof emailSchema>
export type TokenInput = z.infer<typeof tokenSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type ProfileInput = z.infer<typeof profileSchema>
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>
