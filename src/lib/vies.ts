import * as soap from "soap"

export interface VIESResponse {
  valid: boolean
  name: string
  address: string
  countryCode: string
  vatNumber: string
  requestDate: Date
}

const VIES_WSDL = "http://ec.europa.eu/taxation_customs/vies/checkVatService.wsdl"

export async function checkVAT(
  countryCode: string,
  vatNumber: string
): Promise<VIESResponse> {
  try {
    const client = await soap.createClientAsync(VIES_WSDL, {
      wsdl_options: {
        timeout: 10000 // 10s timeout
      }
    })

    const result = await client.checkVatAsync({
      countryCode,
      vatNumber
    })

    return {
      valid: result[0].valid,
      name: result[0].name || "",
      address: result[0].address || "",
      countryCode,
      vatNumber,
      requestDate: result[0].requestDate
    }
  } catch (error) {
    console.error("VIES API error:", error)
    throw new Error("VIES_API_UNAVAILABLE")
  }
}

// Retry wrapper with exponential backoff
export async function checkVATWithRetry(
  countryCode: string,
  vatNumber: string,
  maxRetries = 3
): Promise<VIESResponse> {
  let lastError: Error | null = null

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await checkVAT(countryCode, vatNumber)
    } catch (error) {
      lastError = error as Error
      // Exponential backoff: 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)))
    }
  }

  throw lastError || new Error("VIES_API_UNAVAILABLE")
}
