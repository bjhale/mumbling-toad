import { describe, it, expect, vi, afterEach } from 'vitest';
import { exportToJson } from './json.js';
import type { PageData, CrawlStats } from '../crawler/types.js';

vi.mock('fs');

describe('exportToJson', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('exports JSON with crawlDate, stats, and pages keys', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T10:30:00.000Z'));

    const mockPages: PageData[] = [
      {
        url: 'https://example.com',
        finalUrl: 'https://example.com',
        statusCode: 200,
        title: 'Example',
        isIndexable: true,
        indexabilityReason: null,
        metaDescription: 'Test',
        h1: 'Heading',
        wordCount: 100,
        responseTimeMs: 250,
        contentType: 'text/html'
      }
    ];

    const mockStats: CrawlStats = {
      pagesCrawled: 1,
      pagesInQueue: 0,
      errors: 0,
      startTime: 1736936000000,
      uniqueUrlsFound: 1,
      indexableCount: 1,
      nonIndexableCount: 0,
      statusCodes: { '2xx': 1 },
      totalResponseTimeMs: 250
    };

    const fs = await import('fs');
    const writeFileSyncMock = vi.mocked(fs.writeFileSync);

    exportToJson(mockPages, mockStats, '/tmp/output.json');

    expect(writeFileSyncMock).toHaveBeenCalledTimes(1);
    const [path, content, encoding] = writeFileSyncMock.mock.calls[0]!;
    expect(path).toBe('/tmp/output.json');
    expect(encoding).toBe('utf8');

    const parsedContent = JSON.parse(content as string);
    expect(parsedContent).toHaveProperty('crawlDate');
    expect(parsedContent).toHaveProperty('stats');
    expect(parsedContent).toHaveProperty('pages');
  });

  it('sets crawlDate to mocked system time in ISO format', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T10:30:00.000Z'));

    const mockPages: PageData[] = [];
    const mockStats: CrawlStats = {
      pagesCrawled: 0,
      pagesInQueue: 0,
      errors: 0,
      startTime: 1736936000000,
      uniqueUrlsFound: 0,
      indexableCount: 0,
      nonIndexableCount: 0,
      statusCodes: {},
      totalResponseTimeMs: 0
    };

    const fs = await import('fs');
    const writeFileSyncMock = vi.mocked(fs.writeFileSync);

    exportToJson(mockPages, mockStats, '/tmp/output.json');

    const content = writeFileSyncMock.mock.calls[0]![1] as string;
    const parsedContent = JSON.parse(content);
    expect(parsedContent.crawlDate).toBe('2025-01-15T10:30:00.000Z');
  });

  it('formats JSON with 2-space indentation', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T10:30:00.000Z'));

    const mockPages: PageData[] = [
      {
        url: 'https://example.com',
        finalUrl: 'https://example.com',
        statusCode: 200,
        title: 'Example',
        isIndexable: true,
        indexabilityReason: null,
        metaDescription: 'Test',
        h1: 'Heading',
        wordCount: 100,
        responseTimeMs: 250,
        contentType: 'text/html'
      }
    ];

    const mockStats: CrawlStats = {
      pagesCrawled: 1,
      pagesInQueue: 0,
      errors: 0,
      startTime: 1736936000000,
      uniqueUrlsFound: 1,
      indexableCount: 1,
      nonIndexableCount: 0,
      statusCodes: { '2xx': 1 },
      totalResponseTimeMs: 250
    };

    const fs = await import('fs');
    const writeFileSyncMock = vi.mocked(fs.writeFileSync);

    exportToJson(mockPages, mockStats, '/tmp/output.json');

    const content = writeFileSyncMock.mock.calls[0]![1] as string;
    
    expect(content).toContain('{\n  "crawlDate"');
    expect(content).toContain('  "stats": {');
    expect(content).toContain('    "pagesCrawled": 1');
  });

  it('handles empty pages array correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T10:30:00.000Z'));

    const mockPages: PageData[] = [];
    const mockStats: CrawlStats = {
      pagesCrawled: 0,
      pagesInQueue: 0,
      errors: 0,
      startTime: 1736936000000,
      uniqueUrlsFound: 0,
      indexableCount: 0,
      nonIndexableCount: 0,
      statusCodes: {},
      totalResponseTimeMs: 0
    };

    const fs = await import('fs');
    const writeFileSyncMock = vi.mocked(fs.writeFileSync);

    exportToJson(mockPages, mockStats, '/tmp/output.json');

    expect(writeFileSyncMock).toHaveBeenCalledTimes(1);
    const content = writeFileSyncMock.mock.calls[0]![1] as string;
    const parsedContent = JSON.parse(content);
    
    expect(parsedContent.pages).toEqual([]);
    expect(Array.isArray(parsedContent.pages)).toBe(true);
    expect(parsedContent.pages.length).toBe(0);
  });

  it('calls fs.writeFileSync with correct arguments', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T10:30:00.000Z'));

    const mockPages: PageData[] = [
      {
        url: 'https://test.com',
        finalUrl: 'https://test.com',
        statusCode: 200,
        title: 'Test',
        isIndexable: true,
        indexabilityReason: null,
        metaDescription: 'Desc',
        h1: 'H1',
        wordCount: 50,
        responseTimeMs: 100,
        contentType: 'text/html'
      }
    ];

    const mockStats: CrawlStats = {
      pagesCrawled: 1,
      pagesInQueue: 0,
      errors: 0,
      startTime: 1736936000000,
      uniqueUrlsFound: 1,
      indexableCount: 1,
      nonIndexableCount: 0,
      statusCodes: { '2xx': 1 },
      totalResponseTimeMs: 100
    };

    const fs = await import('fs');
    const writeFileSyncMock = vi.mocked(fs.writeFileSync);

    const outputPath = '/tmp/test-output.json';
    exportToJson(mockPages, mockStats, outputPath);

    expect(writeFileSyncMock).toHaveBeenCalledWith(
      outputPath,
      expect.any(String),
      'utf8'
    );

    const jsonString = writeFileSyncMock.mock.calls[0]![1] as string;
    expect(() => JSON.parse(jsonString)).not.toThrow();
  });

  it('preserves all stats properties in output', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T10:30:00.000Z'));

    const mockPages: PageData[] = [];
    const mockStats: CrawlStats = {
      pagesCrawled: 42,
      pagesInQueue: 8,
      errors: 3,
      startTime: 1736936000000,
      uniqueUrlsFound: 50,
      indexableCount: 35,
      nonIndexableCount: 7,
      statusCodes: { '2xx': 35, '3xx': 5, '4xx': 2 },
      totalResponseTimeMs: 12500
    };

    const fs = await import('fs');
    const writeFileSyncMock = vi.mocked(fs.writeFileSync);

    exportToJson(mockPages, mockStats, '/tmp/output.json');

    const content = writeFileSyncMock.mock.calls[0]![1] as string;
    const parsedContent = JSON.parse(content);
    
    expect(parsedContent.stats).toEqual(mockStats);
  });

  it('preserves all page properties in output', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T10:30:00.000Z'));

    const mockPage: PageData = {
      url: 'https://example.com/page',
      finalUrl: 'https://example.com/page-redirected',
      statusCode: 301,
      title: 'Page Title',
      isIndexable: false,
      indexabilityReason: 'noindex meta tag',
      metaDescription: 'Meta description text',
      h1: 'Main Heading',
      wordCount: 1500,
      responseTimeMs: 450,
      contentType: 'text/html; charset=utf-8'
    };

    const mockStats: CrawlStats = {
      pagesCrawled: 1,
      pagesInQueue: 0,
      errors: 0,
      startTime: 1736936000000,
      uniqueUrlsFound: 1,
      indexableCount: 0,
      nonIndexableCount: 1,
      statusCodes: { '3xx': 1 },
      totalResponseTimeMs: 450
    };

    const fs = await import('fs');
    const writeFileSyncMock = vi.mocked(fs.writeFileSync);

    exportToJson([mockPage], mockStats, '/tmp/output.json');

    const content = writeFileSyncMock.mock.calls[0]![1] as string;
    const parsedContent = JSON.parse(content);
    
    expect(parsedContent.pages).toHaveLength(1);
    expect(parsedContent.pages[0]).toEqual(mockPage);
  });
});
