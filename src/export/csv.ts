import { stringify } from 'csv-stringify/sync';
import fs from 'fs';
import { PageData } from '../crawler/types.js';

export function exportToCsv(pages: PageData[], outputPath: string): void {
  const csv = stringify(pages, {
    header: true,
    columns: [
      'url', 'finalUrl', 'statusCode', 'title', 
      'isIndexable', 'indexabilityReason', 
      'metaDescription', 'h1', 'wordCount', 
      'responseTimeMs', 'contentType'
    ]
  });
  fs.writeFileSync(outputPath, csv, 'utf8');
}
