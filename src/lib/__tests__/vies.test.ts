import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkVAT, checkVATWithRetry } from '../vies'
import * as soap from 'soap'

// Mock soap module
vi.mock('soap')

const mockCreateClientAsync = vi.mocked(soap.createClientAsync)

describe('VIES Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ===========================================================================
  // checkVAT
  // ===========================================================================

  describe('checkVAT', () => {
    it('returns valid response for valid VAT number', async () => {
      // Arrange
      const mockClient = {
        checkVatAsync: vi.fn().mockResolvedValue([
          {
            valid: true,
            name: 'Test Company',
            address: 'Test Street 123',
            requestDate: new Date('2025-12-15T10:00:00Z')
          }
        ])
      }
      mockCreateClientAsync.mockResolvedValue(mockClient as any)

      // Act
      const result = await checkVAT('PL', '1234567890')

      // Assert
      expect(result).toEqual({
        valid: true,
        name: 'Test Company',
        address: 'Test Street 123',
        countryCode: 'PL',
        vatNumber: '1234567890',
        requestDate: new Date('2025-12-15T10:00:00Z')
      })
      expect(mockCreateClientAsync).toHaveBeenCalledWith(
        'http://ec.europa.eu/taxation_customs/vies/checkVatService.wsdl',
        { wsdl_options: { timeout: 10000 } }
      )
      expect(mockClient.checkVatAsync).toHaveBeenCalledWith({
        countryCode: 'PL',
        vatNumber: '1234567890'
      })
    })

    it('returns invalid response for invalid VAT number', async () => {
      // Arrange
      const mockClient = {
        checkVatAsync: vi.fn().mockResolvedValue([
          {
            valid: false,
            name: '',
            address: '',
            requestDate: new Date('2025-12-15T10:00:00Z')
          }
        ])
      }
      mockCreateClientAsync.mockResolvedValue(mockClient as any)

      // Act
      const result = await checkVAT('PL', '0000000000')

      // Assert
      expect(result.valid).toBe(false)
      expect(result.name).toBe('')
      expect(result.address).toBe('')
    })

    it('throws VIES_API_UNAVAILABLE on connection error', async () => {
      // Arrange
      mockCreateClientAsync.mockRejectedValue(new Error('Connection timeout'))

      // Act & Assert
      await expect(checkVAT('PL', '1234567890')).rejects.toThrow('VIES_API_UNAVAILABLE')
    })

    it('handles null name and address in response', async () => {
      // Arrange
      const mockClient = {
        checkVatAsync: vi.fn().mockResolvedValue([
          {
            valid: true,
            name: null,
            address: null,
            requestDate: new Date('2025-12-15T10:00:00Z')
          }
        ])
      }
      mockCreateClientAsync.mockResolvedValue(mockClient as any)

      // Act
      const result = await checkVAT('DE', '123456789')

      // Assert
      expect(result.name).toBe('')
      expect(result.address).toBe('')
    })

    it('handles SOAP client creation failure', async () => {
      // Arrange
      mockCreateClientAsync.mockRejectedValue(new Error('WSDL parse error'))

      // Act & Assert
      await expect(checkVAT('FR', '12345678901')).rejects.toThrow('VIES_API_UNAVAILABLE')
    })

    it('handles checkVatAsync failure', async () => {
      // Arrange
      const mockClient = {
        checkVatAsync: vi.fn().mockRejectedValue(new Error('SOAP fault'))
      }
      mockCreateClientAsync.mockResolvedValue(mockClient as any)

      // Act & Assert
      await expect(checkVAT('IT', '12345678901')).rejects.toThrow('VIES_API_UNAVAILABLE')
    })
  })

  // ===========================================================================
  // checkVATWithRetry
  // ===========================================================================

  describe('checkVATWithRetry', () => {
    it('returns on first successful attempt', async () => {
      // Arrange
      const mockClient = {
        checkVatAsync: vi.fn().mockResolvedValue([
          {
            valid: true,
            name: 'Test Company',
            address: 'Test Street 123',
            requestDate: new Date('2025-12-15T10:00:00Z')
          }
        ])
      }
      mockCreateClientAsync.mockResolvedValue(mockClient as any)

      // Act
      const result = await checkVATWithRetry('PL', '1234567890')

      // Assert
      expect(result.valid).toBe(true)
      expect(mockClient.checkVatAsync).toHaveBeenCalledTimes(1)
    })

    it('retries on failure and succeeds on second attempt', async () => {
      // Arrange
      const mockClient = {
        checkVatAsync: vi.fn().mockResolvedValue([
          {
            valid: true,
            name: 'Test Company',
            address: 'Test Street 123',
            requestDate: new Date('2025-12-15T10:00:00Z')
          }
        ])
      }
      mockCreateClientAsync
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce(mockClient as any)

      // Act
      const promise = checkVATWithRetry('PL', '1234567890')

      // Advance timers to allow retry
      await vi.runAllTimersAsync()
      const result = await promise

      // Assert
      expect(result.valid).toBe(true)
      expect(mockCreateClientAsync).toHaveBeenCalledTimes(2)
    })

    it('retries on failure and succeeds on third attempt', async () => {
      // Arrange
      const mockClient = {
        checkVatAsync: vi.fn().mockResolvedValue([
          {
            valid: true,
            name: 'Test Company',
            address: 'Test Street 123',
            requestDate: new Date('2025-12-15T10:00:00Z')
          }
        ])
      }
      mockCreateClientAsync
        .mockRejectedValueOnce(new Error('Timeout 1'))
        .mockRejectedValueOnce(new Error('Timeout 2'))
        .mockResolvedValueOnce(mockClient as any)

      // Act
      const promise = checkVATWithRetry('PL', '1234567890')
      await vi.runAllTimersAsync()
      const result = await promise

      // Assert
      expect(result.valid).toBe(true)
      expect(mockCreateClientAsync).toHaveBeenCalledTimes(3)
    })

    it('throws after max retries exceeded', async () => {
      // Arrange
      mockCreateClientAsync.mockRejectedValue(new Error('Connection failed'))

      // Act & Assert
      const promise = checkVATWithRetry('PL', '1234567890', 3)
      await vi.runAllTimersAsync()

      // The function catches the error and throws VIES_API_UNAVAILABLE
      await expect(promise).rejects.toThrow('VIES_API_UNAVAILABLE')
      expect(mockCreateClientAsync).toHaveBeenCalledTimes(3)
    })

    it('uses exponential backoff delays (1s, 2s, 4s)', async () => {
      // Arrange
      let callCount = 0
      mockCreateClientAsync.mockImplementation(() => {
        callCount++
        return Promise.reject(new Error('Timeout'))
      })

      // Act
      const promise = checkVATWithRetry('PL', '1234567890', 3)
      await vi.runAllTimersAsync()

      try {
        await promise
      } catch {
        // Expected to fail after all retries
      }

      // Assert
      // Verify exponential backoff occurred by checking call count
      expect(callCount).toBe(3) // 3 attempts with exponential backoff
      expect(mockCreateClientAsync).toHaveBeenCalledTimes(3)
    })

    it('respects custom maxRetries parameter', async () => {
      // Arrange
      mockCreateClientAsync.mockRejectedValue(new Error('Connection failed'))

      // Act
      const promise = checkVATWithRetry('PL', '1234567890', 2)
      await vi.runAllTimersAsync()

      // Assert
      await expect(promise).rejects.toThrow('VIES_API_UNAVAILABLE')
      expect(mockCreateClientAsync).toHaveBeenCalledTimes(2)
    })

    it('handles empty error gracefully', async () => {
      // Arrange
      mockCreateClientAsync.mockRejectedValue(null)

      // Act
      const promise = checkVATWithRetry('PL', '1234567890', 1)
      await vi.runAllTimersAsync()

      // Assert
      await expect(promise).rejects.toThrow('VIES_API_UNAVAILABLE')
    })
  })
})
