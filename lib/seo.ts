/**
 * SEO utilities for generating consistent URLs across the site
 */

export const SITE_URL = 'https://www.mobilephlebotomy.org'

/**
 * Convert a relative path to an absolute URL using the production domain
 * @param path - Relative path (e.g., '/us/indiana' or 'us/indiana')
 * @returns Absolute URL (e.g., 'https://www.mobilephlebotomy.org/us/indiana')
 */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}
