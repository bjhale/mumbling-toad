import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportToCsv } from './csv.js';
import { PageData } from '../crawler/types.js';
import fs from 'fs';

vi.mock('fs');

describe('exportToCsv', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockPage: PageData = {
    url: 'https://example.com/page',
    finalUrl: 'https://example.com/page',
    statusCode: 200,
    title: 'Example Page',
    isIndexable: true,
    indexabilityReason: null,
    metaDescription: 'A test page',
    h1: 'Main Heading',
    wordCount: 500,
    responseTimeMs: 150,
    contentType: 'text/html; charset=utf-8'
  };

  it('should export single page with header and one data row', () => {
    const pages = [mockPage];
    exportToCsv(pages, 'output.csv');

    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    const call = vi.mocked(fs.writeFileSync).mock.calls[0];
    expect(call).toBeDefined();
    const [path, csv] = call!;
    expect(path).toBe('output.csv');
    expect(csv).toContain('url,finalUrl,statusCode,title,isIndexable,indexabilityReason,metaDescription,h1,wordCount,responseTimeMs,contentType');
    expect(csv).toContain('https://example.com/page');
    expect(csv).toContain('Example Page');
    
    // Count rows: header + 1 data row
    const rows = (csv as string).trim().split('\n');
    expect(rows.length).toBe(2);
  });

  it('should export multiple pages with correct row count', () => {
    const pages = [
      mockPage,
      {
        ...mockPage,
        url: 'https://example.com/page2',
        finalUrl: 'https://example.com/page2',
        title: 'Second Page',
        isIndexable: false,
        indexabilityReason: 'noindex meta tag'
      },
      {
        ...mockPage,
        url: 'https://example.com/page3',
        finalUrl: 'https://example.com/page3',
        title: 'Third Page',
        statusCode: 404
      }
    ];
    
    exportToCsv(pages, 'output.csv');

    const [, csv] = vi.mocked(fs.writeFileSync).mock.calls[0]!;
    const rows = (csv as string).trim().split('\n');
    expect(rows.length).toBe(4); // header + 3 data rows
    expect(csv).toContain('Second Page');
    expect(csv).toContain('Third Page');
    expect(csv).toContain('noindex meta tag');
  });

  it('should export empty array with header only', () => {
    const pages: PageData[] = [];
    exportToCsv(pages, 'empty.csv');

    const [path, csv] = vi.mocked(fs.writeFileSync).mock.calls[0]!;
    expect(path).toBe('empty.csv');
    
    const rows = (csv as string).trim().split('\n');
    expect(rows.length).toBe(1); // header only
    expect(csv).toBe('url,finalUrl,statusCode,title,isIndexable,indexabilityReason,metaDescription,h1,wordCount,responseTimeMs,contentType\n');
  });

  it('should have header with all 11 columns in correct order', () => {
    const pages = [mockPage];
    exportToCsv(pages, 'output.csv');

    const [, csv] = vi.mocked(fs.writeFileSync).mock.calls[0]!;
    const csvString = csv as string;
    const header = csvString.split('\n')[0]!;
    
    expect(header).toBe('url,finalUrl,statusCode,title,isIndexable,indexabilityReason,metaDescription,h1,wordCount,responseTimeMs,contentType');
    
    // Verify order by column position
    const columns = header.split(',');
    expect(columns).toEqual([
      'url', 'finalUrl', 'statusCode', 'title',
      'isIndexable', 'indexabilityReason',
      'metaDescription', 'h1', 'wordCount',
      'responseTimeMs', 'contentType'
    ]);
    expect(columns.length).toBe(11);
  });

  it('should properly escape commas in CSV fields', () => {
    const pageWithComma: PageData = {
      ...mockPage,
      title: 'Example, Inc - Home Page',
      metaDescription: 'Welcome to Example, Inc, a testing company',
      h1: 'Hello, World'
    };
    
    exportToCsv([pageWithComma], 'output.csv');

    const [, csv] = vi.mocked(fs.writeFileSync).mock.calls[0]!;
    
    // csv-stringify wraps fields with commas in quotes
    expect(csv).toContain('"Example, Inc - Home Page"');
    expect(csv).toContain('"Welcome to Example, Inc, a testing company"');
    expect(csv).toContain('"Hello, World"');
  });

  it('should properly escape quotes in CSV fields', () => {
    const pageWithQuotes: PageData = {
      ...mockPage,
      title: 'The "Best" Example Page',
      metaDescription: 'This is a "great" description',
      h1: 'Say "Hello"'
    };
    
    exportToCsv([pageWithQuotes], 'output.csv');

    const [, csv] = vi.mocked(fs.writeFileSync).mock.calls[0]!;
    
    // csv-stringify escapes quotes by doubling them and wrapping in quotes
    expect(csv).toContain('"The ""Best"" Example Page"');
    expect(csv).toContain('"This is a ""great"" description"');
    expect(csv).toContain('"Say ""Hello"""');
  });

  it('should call fs.writeFileSync with correct parameters', () => {
    const pages = [mockPage];
    const outputPath = '/path/to/output.csv';
    
    exportToCsv(pages, outputPath);

    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    const [path, csv, encoding] = vi.mocked(fs.writeFileSync).mock.calls[0]!;
    
    expect(path).toBe(outputPath);
    expect(typeof csv).toBe('string');
    expect(csv).toContain('url,finalUrl'); // has CSV content
    expect(encoding).toBe('utf8');
  });

  it('should handle null indexabilityReason correctly', () => {
    const indexablePage: PageData = {
      ...mockPage,
      isIndexable: true,
      indexabilityReason: null
    };
    
    exportToCsv([indexablePage], 'output.csv');

    const [, csv] = vi.mocked(fs.writeFileSync).mock.calls[0]!;
    const rows = (csv as string).trim().split('\n');
    const dataRow = rows[1];
    
    // csv-stringify outputs empty field for null, boolean as 1
    expect(dataRow).toContain(',1,,'); // isIndexable=1 (true), indexabilityReason=empty
  });

  it('should handle boolean values correctly', () => {
    const pages: PageData[] = [
      { ...mockPage, isIndexable: true },
      { ...mockPage, url: 'https://example.com/page2', isIndexable: false }
    ];
    
    exportToCsv(pages, 'output.csv');

    const [, csv] = vi.mocked(fs.writeFileSync).mock.calls[0]!;
    
    // csv-stringify outputs booleans as 1/0 not true/false
    expect(csv).toContain(',1,');
    expect(csv).toContain(',,'); // false outputs as empty between commas (0)
  });

  it('should handle numeric values correctly', () => {
    const pageWithNumbers: PageData = {
      ...mockPage,
      statusCode: 404,
      wordCount: 0,
      responseTimeMs: 1234
    };
    
    exportToCsv([pageWithNumbers], 'output.csv');

    const [, csv] = vi.mocked(fs.writeFileSync).mock.calls[0]!;
    
    expect(csv).toContain(',404,');
    expect(csv).toContain(',0,');
    expect(csv).toContain(',1234,');
  });
});
