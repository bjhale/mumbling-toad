/**
 * Core crawl engine using Crawlee's CheerioCrawler.
 */

import { CheerioCrawler, EnqueueStrategy, Configuration, log } from 'crawlee';
import { createTuiLogger } from './tui-logger.js';
import type {
  CrawlOptions,
  OnPageCrawled,
  OnStatsUpdate,
  OnCrawlComplete,
  OnCrawlError,
  PageData,
  CrawlStats,
} from './types.js';
import { extractSeoData } from './extractor.js';
import { normalizeUrl } from '../utils.js';

export class CrawlEngine {
  private crawler: CheerioCrawler | null = null;
  private statsInterval: NodeJS.Timeout | null = null;
  private pages: PageData[] = [];
  private isRunning = false;
  private _isPaused = false;
  private pausedAt = 0;
  private stats: CrawlStats = {
    pagesCrawled: 0,
    pagesInQueue: 0,
    errors: 0,
    startTime: 0,
    uniqueUrlsFound: 0,
    indexableCount: 0,
    nonIndexableCount: 0,
    statusCodes: {},
    contentTypes: {},
    totalResponseTimeMs: 0,
    pausedDurationMs: 0,
  };

  constructor(
    private options: CrawlOptions,
    private callbacks: {
      onPageCrawled: OnPageCrawled;
      onStatsUpdate: OnStatsUpdate;
      onCrawlComplete: OnCrawlComplete;
      onCrawlError: OnCrawlError;
      onLogMessage?: (level: string, message: string) => void;
    }
  ) {
    Configuration.getGlobalConfig().set('persistStorage', false);
    log.setLevel(log.LEVELS.OFF);

    if (this.callbacks.onLogMessage) {
      const logger = createTuiLogger(this.callbacks.onLogMessage);
      log.setOptions({ logger });
     }
   }

  get isPaused(): boolean {
    return this._isPaused;
  }

  pause(): void {
    if (!this.isRunning || this._isPaused) return;
    this._isPaused = true;
    this.pausedAt = Date.now();
    this.crawler?.autoscaledPool?.pause();
  }

  resume(): void {
    if (!this._isPaused) return;
    this._isPaused = false;
    if (this.pausedAt > 0) {
      this.stats.pausedDurationMs += Date.now() - this.pausedAt;
      this.pausedAt = 0;
    }
    this.crawler?.autoscaledPool?.resume();
  }

  togglePause(): void {
    if (this._isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  async start(url: string): Promise<void> {
    const normalizedUrl = normalizeUrl(url);
    this.stats.startTime = Date.now();
    this.isRunning = true;

    this.crawler = new CheerioCrawler({
      maxConcurrency: this.options.maxConcurrency,
      maxRequestsPerCrawl: this.options.maxPages,
      requestHandlerTimeoutSecs: 30,
      additionalMimeTypes: ['application/xml', 'application/json'],

      preNavigationHooks: [
        async ({ request }) => {
          request.userData.startTime = Date.now();
          
          if (this.options.requestDelayMs > 0) {
            await new Promise(resolve => setTimeout(resolve, this.options.requestDelayMs));
          }
        },
      ],

      requestHandler: async ({ request, response, $, enqueueLinks }) => {
        const responseTimeMs = Date.now() - (request.userData.startTime as number);
        const statusCode = response?.statusCode || 200;
        const contentType = response?.headers?.['content-type'] || 'text/html';

        const isHtml = contentType.includes('text/html') || contentType.includes('application/xhtml');

        let pageData: PageData;

        if (isHtml && $) {
          const seoData = extractSeoData($, response!, request);
          pageData = {
            url: request.url,
            finalUrl: request.loadedUrl || request.url,
            statusCode,
            responseTimeMs,
            contentType,
            ...seoData,
          } as PageData;

          await enqueueLinks({
            strategy: EnqueueStrategy.SameHostname,
          });
        } else {
          pageData = {
            url: request.url,
            finalUrl: request.loadedUrl || request.url,
            statusCode,
            responseTimeMs,
            contentType,
            title: '',
            h1: '',
            metaDescription: '',
            wordCount: 0,
            isIndexable: false,
            indexabilityReason: 'non-HTML content',
          };
        }

        this.pages.push(pageData);
        this.stats.pagesCrawled++;
        this.stats.totalResponseTimeMs += responseTimeMs;

        if (pageData.isIndexable) {
          this.stats.indexableCount++;
        } else {
          this.stats.nonIndexableCount++;
        }

        const statusCategory = `${Math.floor(statusCode / 100)}xx`;
        this.stats.statusCodes[statusCategory] = (this.stats.statusCodes[statusCategory] || 0) + 1;

        const mimeType = contentType.split(';')[0]!.trim();
        this.stats.contentTypes[mimeType] = (this.stats.contentTypes[mimeType] || 0) + 1;

        this.callbacks.onPageCrawled(pageData);
      },

      failedRequestHandler: async ({ request, error }) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const mimeMatch = errorMessage.match(/served Content-Type (\S+),.*only .* are allowed/);

        if (mimeMatch) {
          const contentType = mimeMatch[1]!;
          const mimeType = contentType.split(';')[0]!.trim();
          const pageData: PageData = {
            url: request.url,
            finalUrl: request.loadedUrl || request.url,
            statusCode: 200,
            responseTimeMs: 0,
            contentType,
            title: '',
            h1: '',
            metaDescription: '',
            wordCount: 0,
            isIndexable: false,
            indexabilityReason: 'non-HTML content',
          };

          this.pages.push(pageData);
          this.stats.pagesCrawled++;
          this.stats.nonIndexableCount++;
          this.stats.contentTypes[mimeType] = (this.stats.contentTypes[mimeType] || 0) + 1;
          this.callbacks.onPageCrawled(pageData);
          return;
        }

        this.stats.errors++;
        this.callbacks.onCrawlError(error as Error, request.url);
      },
    });

    this.statsInterval = setInterval(async () => {
      if (this.crawler) {
        const crawlerStats = this.crawler.stats.state;
        const requestQueue = await this.crawler.requestQueue;
        const queueInfo = requestQueue ? await requestQueue.getInfo() : null;

        this.stats.pagesInQueue = queueInfo?.pendingRequestCount || 0;
        this.stats.uniqueUrlsFound = crawlerStats.requestsFinished + crawlerStats.requestsFailed + (queueInfo?.pendingRequestCount || 0);

        const activePausedMs = this.pausedAt > 0 ? Date.now() - this.pausedAt : 0;
        this.callbacks.onStatsUpdate({
          ...this.stats,
          pausedDurationMs: this.stats.pausedDurationMs + activePausedMs,
        });
      }
    }, 500);

    await this.crawler.run([normalizedUrl]);
    await this.stop();
  }

  /**
   * Immediate, synchronous abort for user-initiated shutdown (q / Ctrl+C).
   * Does NOT await Crawlee teardown — the process exits right after.
   */
  abort(): void {
    if (!this.isRunning) return;
    this.isRunning = false;

    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }

    if (this.crawler) {
      try {
        this.crawler.autoscaledPool?.abort();
      } catch {
        /* empty */
      }
      this.crawler = null;
    }
  }

  /**
   * Graceful stop — used when the crawl finishes naturally.
   * Awaits Crawlee teardown so storage is flushed properly.
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this._isPaused) {
      this.resume();
    }

    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }

    if (this.crawler) {
      try {
        const queue = await this.crawler.requestQueue;
        if (queue) {
          await this.crawler.teardown();
        }
      } catch (error) {
        if (this.callbacks.onLogMessage) {
          const message = error instanceof Error ? error.message : String(error);
          this.callbacks.onLogMessage('ERROR', `Error during crawler teardown: ${message}`);
        }
      }
      this.crawler = null;
    }

    if (this.pages.length > 0 || this.stats.pagesCrawled > 0) {
      this.callbacks.onCrawlComplete(this.pages, this.stats);
    }
  }
}
