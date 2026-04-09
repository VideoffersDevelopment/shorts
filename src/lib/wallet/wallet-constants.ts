import type { PricingKey } from "./wallet-types"

// Default pricing (fallback if DB empty, used for seed)
export const DEFAULT_PRICING: Record<PricingKey, { cost: number; label: string; description: string; category: string; enabled: boolean }> = {
  PUBLICATION: { cost: 100, label: "Publikacja wideo", description: "Opłata za publikację nowego wideo", category: "publication", enabled: true },
  BOOST_STD: { cost: 80, label: "Boost Standard", description: "Promowanie wideo w feedzie (24h)", category: "boost", enabled: true },
  EXTENSION_30D: { cost: 500, label: "Przedłużenie +30 dni", description: "Przedłużenie emisji wideo o 30 dni", category: "extension", enabled: true },
  EXTENSION_3M: { cost: 1350, label: "Przedłużenie +3 miesiące", description: "Przedłużenie emisji wideo o 3 miesiące (10% rabat)", category: "extension", enabled: true },
  EXTENSION_6M: { cost: 2500, label: "Przedłużenie +6 miesięcy", description: "Przedłużenie emisji wideo o 6 miesięcy (~17% rabat)", category: "extension", enabled: true },
  EXTENSION_12M: { cost: 4500, label: "Przedłużenie +12 miesięcy", description: "Przedłużenie emisji wideo o 12 miesięcy (25% rabat)", category: "extension", enabled: true },
  SUPER_LIKE: { cost: 100, label: "Super Like", description: "Napiwek dla twórcy wideo", category: "interaction", enabled: true },
  MAINTENANCE_FEE: { cost: 500, label: "Opłata utrzymaniowa", description: "Miesięczna opłata za nieaktywne konto (auto)", category: "maintenance", enabled: true },
  WATERMARK_RM: { cost: 50, label: "Usunięcie znaku wodnego", description: "Jednorazowe usunięcie znaku wodnego z wideo", category: "utility", enabled: false },
  UPLOAD_4K: { cost: 100, label: "Upload 4K/60fps", description: "Jednorazowa opłata za upload w jakości 4K", category: "utility", enabled: false },
  LINK_BIO: { cost: 500, label: "Link w Bio (30 dni)", description: "Dodanie linku do profilu na 30 dni", category: "utility", enabled: false },
}

// Point packages for purchase (amounts in grosze for PLN prices)
export const POINT_PACKAGES = [
  { id: "starter",  points: 10_000,  pricePLN: 1_500,  label: "10 000 pkt",  description: "Pakiet startowy" },
  { id: "standard", points: 50_000,  pricePLN: 6_500,  label: "50 000 pkt",  description: "Pakiet standardowy (~7% rabat)" },
  { id: "premium",  points: 100_000, pricePLN: 12_000, label: "100 000 pkt", description: "Pakiet premium (~20% rabat)" },
  { id: "business", points: 500_000, pricePLN: 50_000, label: "500 000 pkt", description: "Pakiet biznesowy (~33% rabat)" },
] as const

export type PointPackageId = typeof POINT_PACKAGES[number]["id"]

// Wallet system constants
export const PROMO_GRANT_AMOUNT = 1_000      // Points granted to new COMPANY accounts
export const PROMO_EXPIRY_DAYS = 60           // Days until PROMO credits expire
export const MAIN_EXPIRY_MONTHS = 12          // Months until MAIN credits expire
export const SPENDING_RESET_MONTHS = 6        // Months added to expiresAt on spending
export const TOPUP_RESET_MONTHS = 12          // Months added to ALL MAIN batches on top-up
export const MAINTENANCE_INACTIVITY_MONTHS = 12  // Months of inactivity before maintenance fee
export const MIN_TOPUP_PLN = 1_500            // Minimum top-up in grosze (15 PLN)

// Points to PLN conversion (for retention notifications)
// Based on cheapest package: 10,000 pkt = 15 PLN
export const POINTS_TO_PLN_RATE = 0.0015

export function pointsToApproxPLN(points: number): string {
  return (points * POINTS_TO_PLN_RATE).toFixed(2)
}
