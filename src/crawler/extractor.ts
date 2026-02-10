/**
 * SEO data extraction logic for crawled pages.
 */

import type { IncomingMessage } from 'http';
import type { Request, CheerioAPI } from 'crawlee';
import type { PageData } from './types.js';

/**
 * Extract SEO data from a crawled HTML page using Cheerio.
 * 
 * @param cheerioApi - Cheerio instance with loaded HTML
 * @param response - HTTP response object
 * @param request - Crawlee request object
 * @returns Partial PageData with extracted SEO fields
 */
export function extractSeoData(
  cheerioApi: CheerioAPI,
  response: IncomingMessage,
  request: Request
): Partial<PageData> {
  const $ = cheerioApi;
  
  // Extract basic SEO fields
  const title = $('title').text().trim() || '';
  const h1 = $('h1').first().text().trim() || '';
  const metaDescription = $('meta[name="description"]').attr('content')?.trim() || '';
  
  // Calculate word count from body text
  const bodyText = $('body').text() || '';
  const words = bodyText
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter((word: string) => word.length > 0);
  const wordCount = words.length;
  
  // Extract content type from response headers
  const contentType = response.headers['content-type'] || 'text/html';
  
  // Get HTTP status code
  const statusCode = response.statusCode || 200;
  
  // Determine indexability
  let isIndexable = true;
  let indexabilityReason: string | null = null;
  
  // Check 1: noindex meta tag
  const robotsMeta = $('meta[name="robots"]').attr('content')?.toLowerCase() || '';
  if (robotsMeta.includes('noindex')) {
    isIndexable = false;
    indexabilityReason = 'noindex meta tag';
  }
  
  // Check 2: X-Robots-Tag header
  if (isIndexable) {
    const xRobotsTag = response.headers['x-robots-tag'];
    const xRobotsValue = Array.isArray(xRobotsTag) ? xRobotsTag.join(',') : (xRobotsTag || '');
    if (xRobotsValue.toLowerCase().includes('noindex')) {
      isIndexable = false;
      indexabilityReason = 'X-Robots-Tag noindex';
    }
  }
  
  // Check 3: Canonical mismatch
  if (isIndexable) {
    const canonicalUrl = $('link[rel="canonical"]').attr('href');
    if (canonicalUrl) {
      // Normalize URLs for comparison
      const normalizedCanonical = normalizeUrl(canonicalUrl, request.loadedUrl || request.url);
      const normalizedCurrent = normalizeUrl(request.loadedUrl || request.url);
      
      if (normalizedCanonical !== normalizedCurrent) {
        isIndexable = false;
        indexabilityReason = 'canonical mismatch';
      }
    }
  }
  
  // Check 4: HTTP status 4xx or 5xx
  if (isIndexable && (statusCode >= 400)) {
    isIndexable = false;
    indexabilityReason = `HTTP ${statusCode}`;
  }
  
  return {
    title,
    h1,
    metaDescription,
    wordCount,
    isIndexable,
    indexabilityReason,
    contentType,
    statusCode,
  };
}

/**
 * Normalize URL for comparison (remove fragments, trailing slashes, etc.)
 */
function normalizeUrl(url: string, baseUrl?: string): string {
  try {
    const parsed = new URL(url, baseUrl);
    // Remove fragment
    parsed.hash = '';
    // Remove trailing slash unless it's just the domain
    let normalized = parsed.href;
    if (normalized.endsWith('/') && parsed.pathname !== '/') {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  } catch {
    return url;
  }
}
