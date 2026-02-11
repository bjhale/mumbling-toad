import { describe, it, expect, vi, afterEach } from 'vitest';
import { exportResults } from './index.js';
import type { PageData, CrawlStats } from '../crawler/types.js';

vi.mock('./csv.js');
vi.mock('./json.js');

const createMockStats = (): CrawlStats => ({
  pagesCrawled: 0,
  pagesInQueue: 0,
  errors: 0,
  startTime: 0,
  uniqueUrlsFound: 0,
  indexableCount: 0,
  nonIndexableCount: 0,
  statusCodes: {},
  totalResponseTimeMs: 0
});

describe('exportResults', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('should sanitize domain by removing protocol', async () => {
    const { exportToCsv } = await import('./csv.js');
    const { exportToJson } = await import('./json.js');
    
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T10:30:00.000Z'));
    vi.spyOn(process, 'cwd').mockReturnValue('/mock/dir');

    const pages: PageData[] = [];
    const stats = createMockStats();

    const result = exportResults(pages, stats, 'https://example.com');

    expect(result.csvPath).toBe('/mock/dir/example-com-20250115-103000.csv');
    expect(result.jsonPath).toBe('/mock/dir/example-com-20250115-103000.json');
    expect(exportToCsv).toHaveBeenCalledWith(pages, '/mock/dir/example-com-20250115-103000.csv');
    expect(exportToJson).toHaveBeenCalledWith(pages, stats, '/mock/dir/example-com-20250115-103000.json');
  });

  it('should sanitize domain with subdomain', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T10:30:00.000Z'));
    vi.spyOn(process, 'cwd').mockReturnValue('/mock/dir');

    const pages: PageData[] = [];
    const stats = createMockStats();

    const result = exportResults(pages, stats, 'https://sub.example.com');

    expect(result.csvPath).toBe('/mock/dir/sub-example-com-20250115-103000.csv');
    expect(result.jsonPath).toBe('/mock/dir/sub-example-com-20250115-103000.json');
  });

  it('should sanitize domain to lowercase', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T10:30:00.000Z'));
    vi.spyOn(process, 'cwd').mockReturnValue('/mock/dir');

    const pages: PageData[] = [];
    const stats = createMockStats();

    const result = exportResults(pages, stats, 'http://EXAMPLE.COM');

    expect(result.csvPath).toBe('/mock/dir/example-com-20250115-103000.csv');
    expect(result.jsonPath).toBe('/mock/dir/example-com-20250115-103000.json');
  });

  it('should sanitize domain with special characters and port', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T10:30:00.000Z'));
    vi.spyOn(process, 'cwd').mockReturnValue('/mock/dir');

    const pages: PageData[] = [];
    const stats = createMockStats();

    const result = exportResults(pages, stats, 'https://my_site.com:8080');

    expect(result.csvPath).toBe('/mock/dir/my-site-com-8080-20250115-103000.csv');
    expect(result.jsonPath).toBe('/mock/dir/my-site-com-8080-20250115-103000.json');
  });

  it('should format timestamp as YYYYMMDD-HHmmss', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T10:30:00.000Z'));
    vi.spyOn(process, 'cwd').mockReturnValue('/mock/dir');

    const pages: PageData[] = [];
    const stats = createMockStats();

    const result = exportResults(pages, stats, 'https://example.com');

    expect(result.csvPath).toContain('20250115-103000');
    expect(result.jsonPath).toContain('20250115-103000');
  });

  it('should construct paths using process.cwd()', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T10:30:00.000Z'));
    vi.spyOn(process, 'cwd').mockReturnValue('/custom/working/directory');

    const pages: PageData[] = [];
    const stats = createMockStats();

    const result = exportResults(pages, stats, 'https://example.com');

    expect(result.csvPath).toBe('/custom/working/directory/example-com-20250115-103000.csv');
    expect(result.jsonPath).toBe('/custom/working/directory/example-com-20250115-103000.json');
  });

  it('should delegate to exportToCsv with correct arguments', async () => {
    const { exportToCsv } = await import('./csv.js');
    
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T10:30:00.000Z'));
    vi.spyOn(process, 'cwd').mockReturnValue('/mock/dir');

    const pages: PageData[] = [
      {
        url: 'https://example.com',
        finalUrl: 'https://example.com',
        statusCode: 200,
        title: 'Test',
        isIndexable: true,
        indexabilityReason: null,
        metaDescription: 'Test description',
        h1: 'Test H1',
        wordCount: 100,
        responseTimeMs: 50,
        contentType: 'text/html'
      }
    ];
    const stats = createMockStats();

    exportResults(pages, stats, 'https://example.com');

    expect(exportToCsv).toHaveBeenCalledWith(pages, '/mock/dir/example-com-20250115-103000.csv');
    expect(exportToCsv).toHaveBeenCalledTimes(1);
  });

  it('should delegate to exportToJson with correct arguments', async () => {
    const { exportToJson } = await import('./json.js');
    
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T10:30:00.000Z'));
    vi.spyOn(process, 'cwd').mockReturnValue('/mock/dir');

    const pages: PageData[] = [
      {
        url: 'https://example.com',
        finalUrl: 'https://example.com',
        statusCode: 200,
        title: 'Test',
        isIndexable: true,
        indexabilityReason: null,
        metaDescription: 'Test description',
        h1: 'Test H1',
        wordCount: 100,
        responseTimeMs: 50,
        contentType: 'text/html'
      }
    ];
    const stats = createMockStats();

    exportResults(pages, stats, 'https://example.com');

    expect(exportToJson).toHaveBeenCalledWith(pages, stats, '/mock/dir/example-com-20250115-103000.json');
    expect(exportToJson).toHaveBeenCalledTimes(1);
  });

  it('should return both csvPath and jsonPath', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T10:30:00.000Z'));
    vi.spyOn(process, 'cwd').mockReturnValue('/mock/dir');

    const pages: PageData[] = [];
    const stats = createMockStats();

    const result = exportResults(pages, stats, 'https://example.com');

    expect(result).toEqual({
      csvPath: '/mock/dir/example-com-20250115-103000.csv',
      jsonPath: '/mock/dir/example-com-20250115-103000.json'
    });
  });
});
