import fs from 'fs';
import { PageData, CrawlStats } from '../crawler/types.js';

export function exportToJson(
  pages: PageData[], 
  stats: CrawlStats, 
  outputPath: string
): void {
  const data = {
    crawlDate: new Date().toISOString(),
    stats,
    pages
  };
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
}
