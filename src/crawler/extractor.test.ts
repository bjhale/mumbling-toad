/**
 * Unit tests for SEO data extraction logic.
 */

import { describe, it, expect } from 'vitest';
import * as cheerio from 'cheerio';
import type { IncomingMessage } from 'http';
import type { Request } from 'crawlee';
import { extractSeoData } from './extractor.js';

describe('extractSeoData', () => {
  describe('Basic extraction', () => {
    it('should extract title, h1, meta description, and word count', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Test Page Title</title>
            <meta name="description" content="This is a test description">
          </head>
          <body>
            <h1>Main Heading</h1>
            <p>This is some content with multiple words to count.</p>
          </body>
        </html>
      `;
      
      const $ = cheerio.load(html);
      const response = {
        headers: {},
        statusCode: 200,
      } as IncomingMessage;
      const request = {
        url: 'https://example.com/test',
        loadedUrl: 'https://example.com/test',
      } as unknown as Request;
      
      const result = extractSeoData($ as any, response, request);
      
      expect(result.title).toBe('Test Page Title');
      expect(result.h1).toBe('Main Heading');
      expect(result.metaDescription).toBe('This is a test description');
      expect(result.wordCount).toBe(11); // "Main Heading This is some content with multiple words to count"
      expect(result.isIndexable).toBe(true);
      expect(result.indexabilityReason).toBeNull();
    });

    it('should extract first h1 when multiple h1 tags exist', () => {
      const html = `
        <body>
          <h1>First H1</h1>
          <h1>Second H1</h1>
        </body>
      `;
      
      const $ = cheerio.load(html);
      const response = { headers: {}, statusCode: 200 } as IncomingMessage;
      const request = { url: 'https://example.com/', loadedUrl: 'https://example.com/' } as unknown as Request;
      
      const result = extractSeoData($ as any, response, request);
      
      expect(result.h1).toBe('First H1');
    });

    it('should return empty strings for missing title, h1, and meta description', () => {
      const html = '<body><p>Content only</p></body>';
      
      const $ = cheerio.load(html);
      const response = { headers: {}, statusCode: 200 } as IncomingMessage;
      const request = { url: 'https://example.com/', loadedUrl: 'https://example.com/' } as unknown as Request;
      
      const result = extractSeoData($ as any, response, request);
      
      expect(result.title).toBe('');
      expect(result.h1).toBe('');
      expect(result.metaDescription).toBe('');
      expect(result.wordCount).toBe(2); // "Content only"
    });

    it('should calculate word count correctly with extra whitespace', () => {
      const html = `
        <body>
          <p>  Multiple   spaces   between   words  </p>
          <p>
            Line breaks
            and tabs
          </p>
        </body>
      `;
      
      const $ = cheerio.load(html);
      const response = { headers: {}, statusCode: 200 } as IncomingMessage;
      const request = { url: 'https://example.com/', loadedUrl: 'https://example.com/' } as unknown as Request;
      
      const result = extractSeoData($ as any, response, request);
      
      expect(result.wordCount).toBe(8); // "Multiple spaces between words Line breaks and tabs"
    });

    it('should default content-type to text/html when header is missing', () => {
      const html = '<body>Content</body>';
      
      const $ = cheerio.load(html);
      const response = { headers: {}, statusCode: 200 } as IncomingMessage;
      const request = { url: 'https://example.com/', loadedUrl: 'https://example.com/' } as unknown as Request;
      
      const result = extractSeoData($ as any, response, request);
      
      expect(result.contentType).toBe('text/html');
    });

    it('should extract content-type from response headers', () => {
      const html = '<body>Content</body>';
      
      const $ = cheerio.load(html);
      const response = {
        headers: { 'content-type': 'text/html; charset=utf-8' },
        statusCode: 200,
      } as IncomingMessage;
      const request = { url: 'https://example.com/', loadedUrl: 'https://example.com/' } as unknown as Request;
      
      const result = extractSeoData($ as any, response, request);
      
      expect(result.contentType).toBe('text/html; charset=utf-8');
    });
  });

  describe('Indexability: noindex meta tag', () => {
    it('should mark page as non-indexable with noindex meta tag', () => {
      const html = `
        <head>
          <meta name="robots" content="noindex">
        </head>
        <body>Content</body>
      `;
      
      const $ = cheerio.load(html);
      const response = { headers: {}, statusCode: 200 } as IncomingMessage;
      const request = { url: 'https://example.com/', loadedUrl: 'https://example.com/' } as unknown as Request;
      
      const result = extractSeoData($ as any, response, request);
      
      expect(result.isIndexable).toBe(false);
      expect(result.indexabilityReason).toBe('noindex meta tag');
    });

    it('should detect noindex in combined robots directives', () => {
      const html = `
        <head>
          <meta name="robots" content="noindex, nofollow">
        </head>
        <body>Content</body>
      `;
      
      const $ = cheerio.load(html);
      const response = { headers: {}, statusCode: 200 } as IncomingMessage;
      const request = { url: 'https://example.com/', loadedUrl: 'https://example.com/' } as unknown as Request;
      
      const result = extractSeoData($ as any, response, request);
      
      expect(result.isIndexable).toBe(false);
      expect(result.indexabilityReason).toBe('noindex meta tag');
    });

    it('should be case-insensitive for noindex detection', () => {
      const html = `
        <head>
          <meta name="robots" content="NoIndex">
        </head>
        <body>Content</body>
      `;
      
      const $ = cheerio.load(html);
      const response = { headers: {}, statusCode: 200 } as IncomingMessage;
      const request = { url: 'https://example.com/', loadedUrl: 'https://example.com/' } as unknown as Request;
      
      const result = extractSeoData($ as any, response, request);
      
      expect(result.isIndexable).toBe(false);
      expect(result.indexabilityReason).toBe('noindex meta tag');
    });
  });

  describe('Indexability: X-Robots-Tag header', () => {
    it('should mark page as non-indexable with X-Robots-Tag string header', () => {
      const html = '<body>Content</body>';
      
      const $ = cheerio.load(html);
      const response = {
        headers: { 'x-robots-tag': 'noindex' },
        statusCode: 200,
      } as unknown as IncomingMessage;
      const request = { url: 'https://example.com/', loadedUrl: 'https://example.com/' } as unknown as Request;
      
      const result = extractSeoData($ as any, response, request);
      
      expect(result.isIndexable).toBe(false);
      expect(result.indexabilityReason).toBe('X-Robots-Tag noindex');
    });

    it('should handle X-Robots-Tag as array of headers', () => {
      const html = '<body>Content</body>';
      
      const $ = cheerio.load(html);
      const response = {
        headers: { 'x-robots-tag': ['noindex', 'nofollow'] },
        statusCode: 200,
      } as unknown as IncomingMessage;
      const request = { url: 'https://example.com/', loadedUrl: 'https://example.com/' } as unknown as Request;
      
      const result = extractSeoData($ as any, response, request);
      
      expect(result.isIndexable).toBe(false);
      expect(result.indexabilityReason).toBe('X-Robots-Tag noindex');
    });

    it('should be case-insensitive for X-Robots-Tag header', () => {
      const html = '<body>Content</body>';
      
      const $ = cheerio.load(html);
      const response = {
        headers: { 'x-robots-tag': 'NoIndex' },
        statusCode: 200,
      } as unknown as IncomingMessage;
      const request = { url: 'https://example.com/', loadedUrl: 'https://example.com/' } as unknown as Request;
      
      const result = extractSeoData($ as any, response, request);
      
      expect(result.isIndexable).toBe(false);
      expect(result.indexabilityReason).toBe('X-Robots-Tag noindex');
    });
  });

  describe('Indexability: canonical mismatch', () => {
    it('should mark page as non-indexable when canonical URL differs', () => {
      const html = `
        <head>
          <link rel="canonical" href="https://example.com/other-page">
        </head>
        <body>Content</body>
      `;
      
      const $ = cheerio.load(html);
      const response = { headers: {}, statusCode: 200 } as IncomingMessage;
      const request = {
        url: 'https://example.com/this-page',
        loadedUrl: 'https://example.com/this-page',
      } as unknown as Request;
      
      const result = extractSeoData($ as any, response, request);
      
      expect(result.isIndexable).toBe(false);
      expect(result.indexabilityReason).toBe('canonical mismatch');
    });

    it('should resolve relative canonical URLs correctly', () => {
      const html = `
        <head>
          <link rel="canonical" href="/page">
        </head>
        <body>Content</body>
      `;
      
      const $ = cheerio.load(html);
      const response = { headers: {}, statusCode: 200 } as IncomingMessage;
      const request = {
        url: 'https://example.com/page',
        loadedUrl: 'https://example.com/page',
      } as unknown as Request;
      
      const result = extractSeoData($ as any, response, request);
      
      expect(result.isIndexable).toBe(true);
      expect(result.indexabilityReason).toBeNull();
    });

    it('should normalize URLs and ignore trailing slashes', () => {
      const html = `
        <head>
          <link rel="canonical" href="https://example.com/page">
        </head>
        <body>Content</body>
      `;
      
      const $ = cheerio.load(html);
      const response = { headers: {}, statusCode: 200 } as IncomingMessage;
      const request = {
        url: 'https://example.com/page/',
        loadedUrl: 'https://example.com/page/',
      } as unknown as Request;
      
      const result = extractSeoData($ as any, response, request);
      
      expect(result.isIndexable).toBe(true);
      expect(result.indexabilityReason).toBeNull();
    });

    it('should normalize URLs and ignore fragments', () => {
      const html = `
        <head>
          <link rel="canonical" href="https://example.com/page#section">
        </head>
        <body>Content</body>
      `;
      
      const $ = cheerio.load(html);
      const response = { headers: {}, statusCode: 200 } as IncomingMessage;
      const request = {
        url: 'https://example.com/page',
        loadedUrl: 'https://example.com/page',
      } as unknown as Request;
      
      const result = extractSeoData($ as any, response, request);
      
      expect(result.isIndexable).toBe(true);
      expect(result.indexabilityReason).toBeNull();
    });
  });

  describe('Indexability: HTTP status codes', () => {
    it('should mark page as non-indexable with 404 status', () => {
      const html = '<body>Not Found</body>';
      
      const $ = cheerio.load(html);
      const response = { headers: {}, statusCode: 404 } as IncomingMessage;
      const request = { url: 'https://example.com/', loadedUrl: 'https://example.com/' } as unknown as Request;
      
      const result = extractSeoData($ as any, response, request);
      
      expect(result.isIndexable).toBe(false);
      expect(result.indexabilityReason).toBe('HTTP 404');
      expect(result.statusCode).toBe(404);
    });

    it('should mark page as non-indexable with 500 status', () => {
      const html = '<body>Server Error</body>';
      
      const $ = cheerio.load(html);
      const response = { headers: {}, statusCode: 500 } as IncomingMessage;
      const request = { url: 'https://example.com/', loadedUrl: 'https://example.com/' } as unknown as Request;
      
      const result = extractSeoData($ as any, response, request);
      
      expect(result.isIndexable).toBe(false);
      expect(result.indexabilityReason).toBe('HTTP 500');
      expect(result.statusCode).toBe(500);
    });

    it('should keep page indexable with 200 status', () => {
      const html = '<body>Success</body>';
      
      const $ = cheerio.load(html);
      const response = { headers: {}, statusCode: 200 } as IncomingMessage;
      const request = { url: 'https://example.com/', loadedUrl: 'https://example.com/' } as unknown as Request;
      
      const result = extractSeoData($ as any, response, request);
      
      expect(result.isIndexable).toBe(true);
      expect(result.indexabilityReason).toBeNull();
      expect(result.statusCode).toBe(200);
    });

    it('should keep page indexable with 301 redirect status', () => {
      const html = '<body>Moved</body>';
      
      const $ = cheerio.load(html);
      const response = { headers: {}, statusCode: 301 } as IncomingMessage;
      const request = { url: 'https://example.com/', loadedUrl: 'https://example.com/new' } as unknown as Request;
      
      const result = extractSeoData($ as any, response, request);
      
      expect(result.isIndexable).toBe(true);
      expect(result.indexabilityReason).toBeNull();
      expect(result.statusCode).toBe(301);
    });
  });

  describe('Indexability: priority ordering', () => {
    it('should prioritize noindex meta over canonical mismatch', () => {
      const html = `
        <head>
          <meta name="robots" content="noindex">
          <link rel="canonical" href="https://example.com/other">
        </head>
        <body>Content</body>
      `;
      
      const $ = cheerio.load(html);
      const response = { headers: {}, statusCode: 200 } as IncomingMessage;
      const request = {
        url: 'https://example.com/this',
        loadedUrl: 'https://example.com/this',
      } as unknown as Request;
      
      const result = extractSeoData($ as any, response, request);
      
      expect(result.isIndexable).toBe(false);
      expect(result.indexabilityReason).toBe('noindex meta tag');
    });

    it('should prioritize X-Robots-Tag over status code', () => {
      const html = '<body>Content</body>';
      
      const $ = cheerio.load(html);
      const response = {
        headers: { 'x-robots-tag': 'noindex' },
        statusCode: 404,
      } as unknown as IncomingMessage;
      const request = { url: 'https://example.com/', loadedUrl: 'https://example.com/' } as unknown as Request;
      
      const result = extractSeoData($ as any, response, request);
      
      expect(result.isIndexable).toBe(false);
      expect(result.indexabilityReason).toBe('X-Robots-Tag noindex');
    });

    it('should prioritize canonical mismatch over status code', () => {
      const html = `
        <head>
          <link rel="canonical" href="https://example.com/other">
        </head>
        <body>Content</body>
      `;
      
      const $ = cheerio.load(html);
      const response = { headers: {}, statusCode: 404 } as IncomingMessage;
      const request = {
        url: 'https://example.com/this',
        loadedUrl: 'https://example.com/this',
      } as unknown as Request;
      
      const result = extractSeoData($ as any, response, request);
      
      expect(result.isIndexable).toBe(false);
      expect(result.indexabilityReason).toBe('canonical mismatch');
    });

    it('should check all conditions in order: noindex > X-Robots-Tag > canonical > status', () => {
      const html = `
        <head>
          <link rel="canonical" href="https://example.com/same">
        </head>
        <body>Content</body>
      `;
      
      const $ = cheerio.load(html);
      const response = { headers: {}, statusCode: 200 } as IncomingMessage;
      const request = {
        url: 'https://example.com/same',
        loadedUrl: 'https://example.com/same',
      } as unknown as Request;
      
      const result = extractSeoData($ as any, response, request);
      
      expect(result.isIndexable).toBe(true);
      expect(result.indexabilityReason).toBeNull();
    });
  });
});
