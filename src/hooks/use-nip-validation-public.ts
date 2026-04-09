"use client"

import { useState, useCallback, useRef } from "react"
import { validateNipPublicAction } from "@/app/actions/companies/validate-nip-public"
import type { NipValidationResult } from "@/app/actions/companies/validate-nip-public"

export type ValidationStatus = "idle" | "validating" | "success" | "error"

export interface UseNipValidationPublicReturn {
  status: ValidationStatus
  validationResult: NipValidationResult | null
  isValidating: boolean
  validateNip: (nip: string) => void
  reset: () => void
  setValidationResult: (result: NipValidationResult | null) => void
}

// NIP format regex (10 digits or XX-XXX-XXX-XX)
const NIP_REGEX = /^\d{10}$|^\d{2}-\d{3}-\d{3}-\d{2}$/

/**
 * Public NIP validation hook for company signup.
 * Uses the public validation action that doesn't require authentication.
 */
export function useNipValidationPublic(): UseNipValidationPublicReturn {
  const [status, setStatus] = useState<ValidationStatus>("idle")
  const [validationResult, setValidationResult] = useState<NipValidationResult | null>(null)
  // Use request counter instead of AbortController (Server Actions don't support abort)
  const requestCounterRef = useRef(0)

  const validateNip = useCallback(async (nip: string) => {
    // Increment counter to invalidate previous requests
    const currentRequest = ++requestCounterRef.current

    // Empty NIP - reset to idle
    const trimmedNip = nip.trim()
    if (!trimmedNip) {
      setStatus("idle")
      setValidationResult(null)
      return
    }

    // Basic format check before calling server
    if (!NIP_REGEX.test(trimmedNip)) {
      setStatus("error")
      setValidationResult({
        isValid: false,
        isUnique: true,
        viesStatus: "invalid",
        error: "nipValidation.errors.invalidFormat"
      })
      return
    }

    // Set validating state
    setStatus("validating")

    try {
      const result = await validateNipPublicAction(trimmedNip)

      // Ignore if a newer request was made
      if (currentRequest !== requestCounterRef.current) {
        return
      }

      if (!result.success) {
        setStatus("error")
        setValidationResult({
          isValid: false,
          isUnique: true,
          viesStatus: "invalid",
          error: result.error
        })
        return
      }

      const data = result.data
      setValidationResult(data)

      // Determine status based on validation result
      if (!data.isValid || !data.isUnique) {
        setStatus("error")
      } else {
        setStatus("success")
      }
    } catch (error) {
      // Ignore if a newer request was made
      if (currentRequest !== requestCounterRef.current) {
        return
      }

      console.error("NIP validation error:", error)
      setStatus("error")
      setValidationResult({
        isValid: false,
        isUnique: true,
        viesStatus: "unavailable",
        error: "nipValidation.errors.validationFailed"
      })
    }
  }, [])

  const reset = useCallback(() => {
    // Increment counter to invalidate any pending requests
    requestCounterRef.current++
    setStatus("idle")
    setValidationResult(null)
  }, [])

  // Allow external setting of validation result (for race condition handling)
  const setValidationResultExternal = useCallback((result: NipValidationResult | null) => {
    setValidationResult(result)
    if (result) {
      setStatus(result.isValid && result.isUnique ? "success" : "error")
    } else {
      setStatus("idle")
    }
  }, [])

  return {
    status,
    validationResult,
    isValidating: status === "validating",
    validateNip,
    reset,
    setValidationResult: setValidationResultExternal
  }
}
