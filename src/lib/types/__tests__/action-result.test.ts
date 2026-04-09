import { describe, it, expect } from 'vitest'
import { ZodError, z } from 'zod'
import {
  createError,
  createSuccess,
  formatZodError,
  type ActionResult,
  type ActionError,
  type ActionSuccess
} from '../action-result'

describe('action-result', () => {
  // ===========================================================================
  // createError
  // ===========================================================================

  describe('createError', () => {
    it('creates error with message only', () => {
      const result = createError('Something went wrong')

      expect(result).toEqual({
        success: false,
        error: 'Something went wrong',
        code: undefined,
        field: undefined
      })
    })

    it('creates error with code', () => {
      const result = createError('Unauthorized', 'UNAUTHORIZED')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized')
      expect(result.code).toBe('UNAUTHORIZED')
      expect(result.field).toBeUndefined()
    })

    it('creates error with field', () => {
      const result = createError('Invalid email', 'VALIDATION_ERROR', 'email')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid email')
      expect(result.code).toBe('VALIDATION_ERROR')
      expect(result.field).toBe('email')
    })

    it('creates error with all fields', () => {
      const result = createError('Not found', 'NOT_FOUND', 'userId')

      expect(result).toEqual({
        success: false,
        error: 'Not found',
        code: 'NOT_FOUND',
        field: 'userId'
      })
    })
  })

  // ===========================================================================
  // createSuccess
  // ===========================================================================

  describe('createSuccess', () => {
    it('creates success with data only', () => {
      const data = { id: '123', name: 'Test' }
      const result = createSuccess(data)

      expect(result).toEqual({
        success: true,
        data,
        message: undefined
      })
    })

    it('creates success with message', () => {
      const result = createSuccess({ id: '1' }, 'Created successfully')

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ id: '1' })
      expect(result.message).toBe('Created successfully')
    })

    it('creates success with complex data structure', () => {
      const data = {
        user: { id: '1', email: 'test@example.com' },
        profile: { bio: 'Developer', avatar: null }
      }
      const result = createSuccess(data, 'Profile updated')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(data)
      expect(result.message).toBe('Profile updated')
    })

    it('creates success with null data', () => {
      const result = createSuccess(null)

      expect(result.success).toBe(true)
      expect(result.data).toBeNull()
    })
  })

  // ===========================================================================
  // formatZodError
  // ===========================================================================

  describe('formatZodError', () => {
    it('formats single zod error', () => {
      const schema = z.object({ email: z.string().email() })

      try {
        schema.parse({ email: 'invalid' })
      } catch (e) {
        const result = formatZodError(e as ZodError)

        expect(result.success).toBe(false)
        expect(result.code).toBe('VALIDATION_ERROR')
        expect(result.field).toBe('email')
        expect(result.error).toContain('email')
      }
    })

    it('formats nested path error', () => {
      const schema = z.object({
        user: z.object({
          profile: z.object({
            name: z.string().min(2)
          })
        })
      })

      try {
        schema.parse({ user: { profile: { name: '' } } })
      } catch (e) {
        const result = formatZodError(e as ZodError)

        expect(result.success).toBe(false)
        expect(result.code).toBe('VALIDATION_ERROR')
        expect(result.field).toBe('user.profile.name')
        expect(result.error).toBeDefined()
      }
    })

    it('includes error details', () => {
      const schema = z.object({
        age: z.number().min(18),
        email: z.string().email()
      })

      try {
        schema.parse({ age: 15, email: 'invalid' })
      } catch (e) {
        const result = formatZodError(e as ZodError)

        expect(result.details).toBeDefined()
        expect(Array.isArray(result.details)).toBe(true)
      }
    })

    it('handles empty path gracefully', () => {
      const schema = z.string().min(5)

      try {
        schema.parse('abc')
      } catch (e) {
        const result = formatZodError(e as ZodError)

        expect(result.field).toBe('')
        expect(result.success).toBe(false)
      }
    })

    it('formats array index errors', () => {
      const schema = z.object({
        items: z.array(z.object({
          id: z.string().uuid()
        }))
      })

      try {
        schema.parse({ items: [{ id: 'not-uuid' }] })
      } catch (e) {
        const result = formatZodError(e as ZodError)

        expect(result.field).toBe('items.0.id')
        expect(result.code).toBe('VALIDATION_ERROR')
      }
    })
  })

  // ===========================================================================
  // Type Safety
  // ===========================================================================

  describe('type narrowing', () => {
    it('narrows ActionResult to success', () => {
      const result: ActionResult<{ id: string }> = createSuccess({ id: '123' })

      if (result.success) {
        // TypeScript should allow accessing data
        expect(result.data.id).toBe('123')
        // @ts-expect-error - error should not exist on success
        expect(result.error).toBeUndefined()
      }
    })

    it('narrows ActionResult to error', () => {
      const result: ActionResult<string> = createError('Failed')

      if (!result.success) {
        // TypeScript should allow accessing error
        expect(result.error).toBe('Failed')
        // @ts-expect-error - data should not exist on error
        expect(result.data).toBeUndefined()
      }
    })

    it('works with generic types', () => {
      type User = { id: string; email: string }
      const result: ActionResult<User> = createSuccess({
        id: '1',
        email: 'test@example.com'
      })

      if (result.success) {
        expect(result.data.id).toBe('1')
        expect(result.data.email).toBe('test@example.com')
      }
    })

    it('works with array types', () => {
      type Item = { id: number; name: string }
      const items: Item[] = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ]
      const result: ActionResult<Item[]> = createSuccess(items)

      if (result.success) {
        expect(result.data).toHaveLength(2)
        expect(result.data[0].name).toBe('Item 1')
      }
    })
  })

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  describe('edge cases', () => {
    it('handles empty string error message', () => {
      const result = createError('')

      expect(result.success).toBe(false)
      expect(result.error).toBe('')
    })

    it('handles undefined in createSuccess data', () => {
      const result = createSuccess(undefined)

      expect(result.success).toBe(true)
      expect(result.data).toBeUndefined()
    })

    it('handles special characters in error message', () => {
      const result = createError('Error: <script>alert("xss")</script>')

      expect(result.error).toContain('<script>')
      expect(result.success).toBe(false)
    })

    it('handles very long error messages', () => {
      const longError = 'A'.repeat(1000)
      const result = createError(longError)

      expect(result.error).toHaveLength(1000)
      expect(result.success).toBe(false)
    })
  })
})
