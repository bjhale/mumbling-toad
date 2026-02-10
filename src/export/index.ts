import { exportToCsv } from './csv.js';
import { exportToJson } from './json.js';
import { PageData, CrawlStats } from '../crawler/types.js';

export function exportResults(
  pages: PageData[], 
  stats: CrawlStats, 
  domain: string
): { csvPath: string; jsonPath: string } {
  // Sanitize domain: remove protocol, replace special chars
  const sanitized = domain
    .replace(/^https?:\/\//, '')
    .replace(/[^a-z0-9]/gi, '-')
    .toLowerCase();
  
  // Generate timestamp: YYYYMMDD-HHmmss
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace('T', '-')
    .slice(0, 15);
  
  const baseName = `${sanitized}-${timestamp}`;
  const csvPath = `${process.cwd()}/${baseName}.csv`;
  const jsonPath = `${process.cwd()}/${baseName}.json`;
  
  exportToCsv(pages, csvPath);
  exportToJson(pages, stats, jsonPath);
  
  return { csvPath, jsonPath };
}
