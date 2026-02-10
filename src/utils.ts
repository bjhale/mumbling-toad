/**
 * URL normalization and validation utilities
 */

export function normalizeUrl(input: string): string {
  let url = input.trim();
  
  // Auto-prepend https:// if no protocol
  if (!url.match(/^https?:\/\//i)) {
    url = 'https://' + url;
  }
  
  try {
    const parsed = new URL(url);
    
    // Validate that protocol is http or https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('Invalid protocol');
    }
    
    // Validate that hostname exists and is valid
    if (!parsed.hostname || !parsed.hostname.match(/^[a-zA-Z0-9.-]+$/)) {
      throw new Error('Invalid hostname');
    }
    
    // Strip trailing slash from pathname (but keep root /)
    if (parsed.pathname.endsWith('/') && parsed.pathname.length > 1) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }
    return parsed.href;
  } catch {
    throw new Error('Invalid URL format');
  }
}

export function validateUrl(input: string): { valid: boolean; error?: string } {
  try {
    normalizeUrl(input);
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Please enter a valid domain or URL' };
  }
}
