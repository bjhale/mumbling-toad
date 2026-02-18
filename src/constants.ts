import type { CrawlOptions } from "./crawler/types.js";

/** Application name */
export const APP_NAME = "MumblingToad SEO Crawler";

/** Application version */
export const APP_VERSION = "1.0.0";

/** Minimum terminal width required for the TUI (in columns) */
export const MIN_TERMINAL_WIDTH = 100;

/** Default crawl configuration options */
export const DEFAULT_CRAWL_OPTIONS: CrawlOptions = {
  maxConcurrency: 5,
  requestDelayMs: 200,
  maxPages: 10000,
  maxDepth: 10,
  respectRobotsTxt: true,
  renderJs: false,
  userAgent: "MumblingToad SEO Crawler/1.0",
};

/**
 * Column definition for the results table.
 * Each column specifies: key (field in PageData), label (header text), minWidth (in chars), priority (for visibility order)
 * Priority order determines which columns are shown first when terminal width is limited.
 */
export interface ColumnDefinition {
  key: string;
  label: string;
  minWidth: number;
  priority: number;
}

/** Table column definitions (9 columns, ordered by priority for horizontal scrolling) */
export const COLUMN_DEFINITIONS: ColumnDefinition[] = [
  { key: "url", label: "URL", minWidth: 35, priority: 1 },
  { key: "statusCode", label: "Status", minWidth: 8, priority: 2 },
  { key: "title", label: "Title", minWidth: 25, priority: 3 },
  { key: "isIndexable", label: "Indexable", minWidth: 11, priority: 4 },
  { key: "canonical", label: "Canonical", minWidth: 20, priority: 5 },
  { key: "responseTimeMs", label: "Time (ms)", minWidth: 11, priority: 6 },
  { key: "h1", label: "H1", minWidth: 20, priority: 7 },
  { key: "wordCount", label: "Words", minWidth: 9, priority: 8 },
  { key: "metaDescription", label: "Meta Desc", minWidth: 20, priority: 9 },
  { key: "contentType", label: "Content Type", minWidth: 14, priority: 10 },
];
