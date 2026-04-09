import { describe, it, expect } from 'vitest'
import { isValidHttpUrl, sanitizeUrl, getHostname } from '../url'

describe('URL Utilities', () => {
  // ===========================================================================
  // isValidHttpUrl
  // ===========================================================================

  describe('isValidHttpUrl', () => {
    describe('Valid URLs', () => {
      it('accepts valid HTTP URL', () => {
        expect(isValidHttpUrl('http://example.com')).toBe(true)
      })

      it('accepts valid HTTPS URL', () => {
        expect(isValidHttpUrl('https://example.com')).toBe(true)
      })

      it('accepts URL with path', () => {
        expect(isValidHttpUrl('https://example.com/path/to/page')).toBe(true)
      })

      it('accepts URL with query params', () => {
        expect(isValidHttpUrl('https://example.com?query=value')).toBe(true)
      })

      it('accepts URL with port', () => {
        expect(isValidHttpUrl('https://example.com:8080')).toBe(true)
      })

      it('accepts URL with subdomain', () => {
        expect(isValidHttpUrl('https://subdomain.example.com')).toBe(true)
      })
    })

    describe('Invalid URLs', () => {
      it('rejects javascript: protocol (XSS)', () => {
        expect(isValidHttpUrl('javascript:alert("XSS")')).toBe(false)
      })

      it('rejects data: protocol (XSS)', () => {
        expect(isValidHttpUrl('data:text/html,<script>alert("XSS")</script>')).toBe(false)
      })

      it('rejects ftp: protocol', () => {
        expect(isValidHttpUrl('ftp://example.com')).toBe(false)
      })

      it('rejects file: protocol', () => {
        expect(isValidHttpUrl('file:///etc/passwd')).toBe(false)
      })

      it('rejects mailto: protocol', () => {
        expect(isValidHttpUrl('mailto:test@example.com')).toBe(false)
      })

      it('rejects invalid URL format', () => {
        expect(isValidHttpUrl('not a url')).toBe(false)
      })

      it('rejects empty string', () => {
        expect(isValidHttpUrl('')).toBe(false)
      })

      it('rejects relative URL', () => {
        expect(isValidHttpUrl('/relative/path')).toBe(false)
      })

      it('rejects protocol-relative URL', () => {
        expect(isValidHttpUrl('//example.com')).toBe(false)
      })
    })

    describe('Edge Cases', () => {
      it('rejects URL with only protocol', () => {
        expect(isValidHttpUrl('https://')).toBe(false)
      })

      it('rejects URL with spaces', () => {
        expect(isValidHttpUrl('https://example .com')).toBe(false)
      })

      it('handles URLs with special characters', () => {
        expect(isValidHttpUrl('https://example.com/path?param=value&other=test')).toBe(true)
      })

      it('handles URLs with hash', () => {
        expect(isValidHttpUrl('https://example.com#section')).toBe(true)
      })
    })
  })

  // ===========================================================================
  // sanitizeUrl
  // ===========================================================================

  describe('sanitizeUrl', () => {
    describe('Valid Inputs', () => {
      it('returns valid HTTP URL unchanged', () => {
        const url = 'http://example.com'
        expect(sanitizeUrl(url)).toBe(url)
      })

      it('returns valid HTTPS URL unchanged', () => {
        const url = 'https://example.com'
        expect(sanitizeUrl(url)).toBe(url)
      })

      it('returns valid URL with path unchanged', () => {
        const url = 'https://example.com/path/to/resource'
        expect(sanitizeUrl(url)).toBe(url)
      })

      it('returns valid URL with query params unchanged', () => {
        const url = 'https://example.com?query=value&other=test'
        expect(sanitizeUrl(url)).toBe(url)
      })
    })

    describe('Invalid Inputs', () => {
      it('returns null for null input', () => {
        expect(sanitizeUrl(null)).toBeNull()
      })

      it('returns null for javascript: protocol (XSS protection)', () => {
        expect(sanitizeUrl('javascript:alert("XSS")')).toBeNull()
      })

      it('returns null for data: protocol (XSS protection)', () => {
        expect(sanitizeUrl('data:text/html,<script>alert("XSS")</script>')).toBeNull()
      })

      it('returns null for ftp: protocol', () => {
        expect(sanitizeUrl('ftp://example.com')).toBeNull()
      })

      it('returns null for invalid URL', () => {
        expect(sanitizeUrl('not a url')).toBeNull()
      })

      it('returns null for empty string', () => {
        expect(sanitizeUrl('')).toBeNull()
      })

      it('returns null for relative URL', () => {
        expect(sanitizeUrl('/relative/path')).toBeNull()
      })
    })

    describe('Security Tests', () => {
      it('blocks XSS attempt with javascript: protocol', () => {
        expect(sanitizeUrl('javascript:void(0)')).toBeNull()
      })

      it('blocks XSS attempt with data: URL', () => {
        expect(sanitizeUrl('data:text/html,<img src=x onerror=alert(1)>')).toBeNull()
      })

      it('blocks vbscript: protocol', () => {
        expect(sanitizeUrl('vbscript:msgbox("XSS")')).toBeNull()
      })

      it('blocks file: protocol', () => {
        expect(sanitizeUrl('file:///etc/passwd')).toBeNull()
      })
    })

    describe('Edge Cases', () => {
      it('handles URL with special characters', () => {
        const url = 'https://example.com/path?param=hello%20world'
        expect(sanitizeUrl(url)).toBe(url)
      })

      it('handles URL with hash fragment', () => {
        const url = 'https://example.com#section'
        expect(sanitizeUrl(url)).toBe(url)
      })

      it('handles URL with authentication (not recommended but valid)', () => {
        const url = 'https://user:pass@example.com'
        expect(sanitizeUrl(url)).toBe(url)
      })

      it('handles international domain names', () => {
        const url = 'https://münchen.de'
        expect(sanitizeUrl(url)).toBe(url)
      })
    })
  })

  // ===========================================================================
  // getHostname
  // ===========================================================================

  describe('getHostname', () => {
    describe('Valid URLs', () => {
      it('extracts hostname from simple URL', () => {
        expect(getHostname('https://example.com')).toBe('example.com')
      })

      it('extracts hostname from URL with path', () => {
        expect(getHostname('https://example.com/path/to/page')).toBe('example.com')
      })

      it('extracts hostname from URL with port', () => {
        expect(getHostname('https://example.com:8080')).toBe('example.com')
      })

      it('extracts hostname from URL with subdomain', () => {
        expect(getHostname('https://subdomain.example.com')).toBe('subdomain.example.com')
      })

      it('extracts hostname from URL with query params', () => {
        expect(getHostname('https://example.com?query=value')).toBe('example.com')
      })

      it('extracts hostname from URL with hash', () => {
        expect(getHostname('https://example.com#section')).toBe('example.com')
      })

      it('extracts hostname from URL with multiple subdomains', () => {
        expect(getHostname('https://api.v2.example.com')).toBe('api.v2.example.com')
      })
    })

    describe('Invalid URLs', () => {
      it('returns original string for invalid URL', () => {
        const invalid = 'not a url'
        expect(getHostname(invalid)).toBe(invalid)
      })

      it('returns original string for empty string', () => {
        expect(getHostname('')).toBe('')
      })

      it('returns original string for relative path', () => {
        const relative = '/relative/path'
        expect(getHostname(relative)).toBe(relative)
      })

      it('returns original string for malformed URL', () => {
        const malformed = 'https://'
        expect(getHostname(malformed)).toBe(malformed)
      })
    })

    describe('Edge Cases', () => {
      it('handles localhost', () => {
        expect(getHostname('http://localhost:3000')).toBe('localhost')
      })

      it('handles IP address', () => {
        expect(getHostname('http://192.168.1.1')).toBe('192.168.1.1')
      })

      it('handles IPv6 address', () => {
        expect(getHostname('http://[::1]:8080')).toBe('[::1]')
      })

      it('handles URL with authentication', () => {
        expect(getHostname('https://user:pass@example.com')).toBe('example.com')
      })

      it('handles international domain names (converted to punycode)', () => {
        // URL API converts IDN to punycode
        expect(getHostname('https://münchen.de')).toBe('xn--mnchen-3ya.de')
      })
    })
  })
})
