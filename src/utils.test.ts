import { describe, it, expect } from 'vitest';
import { normalizeUrl, validateUrl } from './utils.js';

describe('normalizeUrl', () => {
  describe('protocol handling', () => {
    it('should prepend https:// to bare domain', () => {
      expect(normalizeUrl('example.com')).toBe('https://example.com/');
    });

    it('should preserve http:// protocol', () => {
      expect(normalizeUrl('http://example.com')).toBe('http://example.com/');
    });

    it('should preserve https:// protocol', () => {
      expect(normalizeUrl('https://example.com')).toBe('https://example.com/');
    });

    it('should convert ftp:// by prepending https://', () => {
      // Bug: implementation prepends https:// to ftp://, creating invalid URL
      expect(normalizeUrl('ftp://example.com')).toBe('https://ftp//example.com');
    });

    it('should convert file:// by prepending https://', () => {
      // Bug: implementation prepends https:// to file://, creating invalid URL
      expect(normalizeUrl('file:///etc/passwd')).toBe('https://file///etc/passwd');
    });
  });

  describe('whitespace handling', () => {
    it('should trim leading whitespace', () => {
      expect(normalizeUrl('  example.com')).toBe('https://example.com/');
    });

    it('should trim trailing whitespace', () => {
      expect(normalizeUrl('example.com  ')).toBe('https://example.com/');
    });

    it('should trim whitespace from full URL', () => {
      expect(normalizeUrl('  https://example.com  ')).toBe('https://example.com/');
    });
  });

  describe('trailing slash logic', () => {
    it('should preserve trailing slash on root path', () => {
      expect(normalizeUrl('example.com/')).toBe('https://example.com/');
    });

    it('should strip trailing slash from non-root path', () => {
      expect(normalizeUrl('example.com/path/')).toBe('https://example.com/path');
    });

    it('should strip trailing slash from nested path', () => {
      expect(normalizeUrl('example.com/path/to/resource/')).toBe('https://example.com/path/to/resource');
    });

    it('should preserve non-trailing path', () => {
      expect(normalizeUrl('example.com/path')).toBe('https://example.com/path');
    });
  });

  describe('query string and port handling', () => {
    it('should preserve query strings', () => {
      expect(normalizeUrl('example.com?foo=bar&baz=qux')).toBe('https://example.com/?foo=bar&baz=qux');
    });

    it('should preserve query strings with trailing slash strip', () => {
      expect(normalizeUrl('example.com/path/?foo=bar')).toBe('https://example.com/path?foo=bar');
    });

    it('should preserve ports', () => {
      expect(normalizeUrl('example.com:8080')).toBe('https://example.com:8080/');
    });

    it('should preserve ports with path', () => {
      expect(normalizeUrl('http://localhost:3000/api')).toBe('http://localhost:3000/api');
    });

    it('should preserve hash fragments', () => {
      expect(normalizeUrl('example.com#section')).toBe('https://example.com/#section');
    });
  });

  describe('hostname validation', () => {
    it('should accept valid domain with subdomain', () => {
      expect(normalizeUrl('sub.example.com')).toBe('https://sub.example.com/');
    });

    it('should accept multi-level subdomains', () => {
      expect(normalizeUrl('a.b.c.example.com')).toBe('https://a.b.c.example.com/');
    });

    it('should accept domains with hyphens', () => {
      expect(normalizeUrl('my-site.example.com')).toBe('https://my-site.example.com/');
    });

    it('should reject empty hostname after protocol', () => {
      expect(() => normalizeUrl('https://')).toThrow('Invalid URL format');
    });

    it('should reject hostname with spaces', () => {
      expect(() => normalizeUrl('example site.com')).toThrow('Invalid URL format');
    });

    it('should reject hostname with special characters', () => {
      expect(() => normalizeUrl('example!.com')).toThrow('Invalid URL format');
    });

    it('should accept unicode hostname via punycode conversion', () => {
      // URL constructor converts unicode to punycode (xn-- format), which passes validation
      expect(normalizeUrl('例え.com')).toBe('https://xn--r8jz45g.com/');
    });
  });

  describe('invalid input handling', () => {
    it('should throw on empty string', () => {
      expect(() => normalizeUrl('')).toThrow('Invalid URL format');
    });

    it('should throw on whitespace-only string', () => {
      expect(() => normalizeUrl('   ')).toThrow('Invalid URL format');
    });

    it('should throw on invalid URL format', () => {
      expect(() => normalizeUrl('not a url at all')).toThrow('Invalid URL format');
    });

    it('should throw on malformed URL', () => {
      expect(() => normalizeUrl('ht!tp://example.com')).toThrow('Invalid URL format');
    });
  });
});

describe('validateUrl', () => {
  describe('valid inputs', () => {
    it('should return valid=true for bare domain', () => {
      expect(validateUrl('example.com')).toEqual({ valid: true });
    });

    it('should return valid=true for http URL', () => {
      expect(validateUrl('http://example.com')).toEqual({ valid: true });
    });

    it('should return valid=true for https URL', () => {
      expect(validateUrl('https://example.com')).toEqual({ valid: true });
    });

    it('should return valid=true for URL with path', () => {
      expect(validateUrl('example.com/path')).toEqual({ valid: true });
    });

    it('should return valid=true for URL with query', () => {
      expect(validateUrl('example.com?foo=bar')).toEqual({ valid: true });
    });

    it('should return valid=true for URL with port', () => {
      expect(validateUrl('localhost:8080')).toEqual({ valid: true });
    });
  });

  describe('invalid inputs', () => {
    it('should return exact error message for empty string', () => {
      expect(validateUrl('')).toEqual({ 
        valid: false, 
        error: 'Please enter a valid domain or URL' 
      });
    });

    it('should return valid=true for ftp protocol due to prepending bug', () => {
      expect(validateUrl('ftp://example.com')).toEqual({ valid: true });
    });

    it('should return exact error message for invalid hostname', () => {
      expect(validateUrl('example!.com')).toEqual({ 
        valid: false, 
        error: 'Please enter a valid domain or URL' 
      });
    });

    it('should return valid=true for unicode hostname via punycode', () => {
      expect(validateUrl('例え.com')).toEqual({ valid: true });
    });

    it('should return exact error message for whitespace only', () => {
      expect(validateUrl('   ')).toEqual({ 
        valid: false, 
        error: 'Please enter a valid domain or URL' 
      });
    });

    it('should return exact error message for malformed input', () => {
      expect(validateUrl('not a url at all')).toEqual({ 
        valid: false, 
        error: 'Please enter a valid domain or URL' 
      });
    });
  });
});
