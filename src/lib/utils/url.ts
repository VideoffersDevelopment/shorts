/**
 * URL validation and sanitization utilities
 */

/**
 * Validates if a string is a valid HTTP/HTTPS URL
 * @param string - The string to validate
 * @returns true if valid HTTP/HTTPS URL, false otherwise
 */
export function isValidHttpUrl(string: string): boolean {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Sanitizes a URL by validating it's a safe HTTP/HTTPS URL
 * @param url - The URL to sanitize
 * @returns The sanitized URL or null if invalid
 */
export function sanitizeUrl(url: string | null): string | null {
  if (!url) return null;
  if (!isValidHttpUrl(url)) return null;
  return url;
}

/**
 * Extracts the hostname from a URL
 * @param url - The URL to extract hostname from
 * @returns The hostname or the original string if parsing fails
 */
export function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
