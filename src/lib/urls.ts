/**
 * URL normalization utilities.
 *
 * These helpers turn user-provided input (e.g. "example.com") into a valid,
 * absolute URL that can be safely fetched.
 */

/**
 * Normalizes a user-provided URL string into an absolute `https://` URL.
 *
 * - Trims whitespace.
 * - Adds `https://` when no scheme is present (e.g. "example.com").
 * - Preserves path, query string, and fragment.
 * - Returns `null` when the input cannot be parsed into a valid URL.
 *
 * @param input The raw user input.
 * @returns A normalized absolute URL string, or `null` if invalid.
 */
export function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  // Prepend a scheme if none is present so `new URL` can parse it.
  const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(withScheme);
    // Reject URLs without a usable hostname.
    if (!url.hostname) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Extracts the hostname (lowercased, without port) from a URL string.
 * Returns `null` if the URL is invalid.
 */
export function getHostname(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Returns whether a URL uses the HTTPS protocol.
 */
export function isHttps(url: string): boolean {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}