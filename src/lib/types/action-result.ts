import type { ZodError } from 'zod'

export type ActionError = {
  success: false
  error: string
  code?: string
  field?: string
  details?: unknown
}

export type ActionSuccess<T> = {
  success: true
  data: T
  message?: string
}

export type ActionResult<T> = ActionSuccess<T> | ActionError

export function formatZodError(error: ZodError): ActionError {
  const firstError = error.errors[0]
  return {
    success: false,
    error: firstError.message,
    code: "VALIDATION_ERROR",
    field: firstError.path.join("."),
    details: error.errors
  }
}

export function createError(
  error: string,
  code?: string,
  field?: string
): ActionError {
  return {
    success: false,
    error,
    code,
    field
  }
}

export function createSuccess<T>(data: T, message?: string): ActionSuccess<T> {
  return {
    success: true,
    data,
    message
  }
}
