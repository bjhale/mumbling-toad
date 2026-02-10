/**
 * Core crawl engine using Crawlee's CheerioCrawler.
 */

import { CheerioCrawler, EnqueueStrategy, Configuration } from 'crawlee';
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

export class CrawlEngine {
  private crawler: CheerioCrawler | null = null;
  private statsInterval: NodeJS.Timeout | null = null;
  private pages: PageData[] = [];
  private stats: CrawlStats = {
    pagesCrawled: 0,
    pagesInQueue: 0,
    errors: 0,
    startTime: 0,
    uniqueUrlsFound: 0,
    indexableCount: 0,
    nonIndexableCount: 0,
    statusCodes: {},
    totalResponseTimeMs: 0,
  };

  constructor(
    private options: CrawlOptions,
    private callbacks: {
      onPageCrawled: OnPageCrawled;
      onStatsUpdate: OnStatsUpdate;
      onCrawlComplete: OnCrawlComplete;
      onCrawlError: OnCrawlError;
    }
  ) {
    Configuration.getGlobalConfig().set('persistStorage', false);
  }

  async start(url: string): Promise<void> {
    const normalizedUrl = this.normalizeUrl(url);
    this.stats.startTime = Date.now();

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

        this.callbacks.onPageCrawled(pageData);
      },

      failedRequestHandler: async ({ request, error }) => {
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

        this.callbacks.onStatsUpdate({ ...this.stats });
      }
    }, 500);

    await this.crawler.run([normalizedUrl]);
    await this.stop();
  }

  async stop(): Promise<void> {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }

    if (this.crawler) {
      await this.crawler.teardown();
      this.crawler = null;
    }

    this.callbacks.onCrawlComplete(this.pages, this.stats);
  }

  private normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.href;
    } catch {
      return `https://${url}`;
    }
  }
}
