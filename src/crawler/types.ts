/**
 * Shared TypeScript types for the SEO crawler TUI application.
 */

/**
 * Data extracted from a single crawled page.
 */
export interface PageData {
  /** URL of the page that was requested */
  url: string;

  /** Final URL after any redirects */
  finalUrl: string;

  /** HTTP status code (200, 404, etc.) */
  statusCode: number;

  /** Page title from <title> tag */
  title: string;

  /** Whether the page is indexable by search engines */
  isIndexable: boolean;

  /**
   * Reason why page is not indexable (null if indexable).
   * Examples: "noindex meta tag", "X-Robots-Tag noindex", "canonical mismatch", "HTTP 404"
   */
  indexabilityReason: string | null;

  /** Meta description from <meta name="description" content="..."> */
  metaDescription: string;

  /** First H1 heading text */
  h1: string;

  /** Total word count of page content (excluding HTML tags) */
  wordCount: number;

  /** Time taken to fetch the page in milliseconds */
  responseTimeMs: number;

  /** Content-Type header value (e.g., "text/html; charset=utf-8") */
  contentType: string;
}

/**
 * Real-time crawl statistics tracking the overall crawl progress.
 */
export interface CrawlStats {
  /** Total pages successfully crawled */
  pagesCrawled: number;

  /** Number of pages waiting in the crawl queue */
  pagesInQueue: number;

  /** Total number of crawl errors encountered */
  errors: number;

  /** Timestamp when crawl started (milliseconds since epoch) */
  startTime: number;

  /** Total unique URLs discovered during crawl */
  uniqueUrlsFound: number;

  /** Count of pages marked as indexable */
  indexableCount: number;

  /** Count of pages marked as non-indexable */
  nonIndexableCount: number;

  /** Distribution of HTTP status codes by category (e.g., {"2xx": 45, "3xx": 2, "4xx": 1, "5xx": 0}) */
  statusCodes: Record<string, number>;

  /** Distribution of content types (e.g., {"text/html": 45, "application/pdf": 2}) */
  contentTypes: Record<string, number>;

  /** Sum of all responseTimeMs values for crawled pages */
  totalResponseTimeMs: number;
}

/**
 * Configuration options for a crawl session.
 */
export interface CrawlOptions {
  /** Maximum number of concurrent requests (default: 5) */
  maxConcurrency: number;

  /** Delay between requests in milliseconds (default: 200) */
  requestDelayMs: number;

  /** Maximum number of pages to crawl (default: 1000) */
  maxPages: number;

  /** Maximum depth to follow links (default: 10) */
  maxDepth: number;

  /** Whether to respect robots.txt file (default: true) */
  respectRobotsTxt: boolean;

  /** Whether to render JavaScript (default: false, not implemented in v1) */
  renderJs: boolean;

  /** User-Agent header value (default: "MumblingToad SEO Crawler/1.0") */
  userAgent: string;
}

/**
 * Callback fired when a single page has been crawled and processed.
 */
export type OnPageCrawled = (page: PageData) => void;

/**
 * Callback fired periodically with updated crawl statistics.
 */
export type OnStatsUpdate = (stats: CrawlStats) => void;

/**
 * Callback fired when the crawl completes (either finished or stopped).
 */
export type OnCrawlComplete = (pages: PageData[], stats: CrawlStats) => void;

/**
 * Callback fired when a crawl error occurs.
 */
export type OnCrawlError = (error: Error, url?: string) => void;
