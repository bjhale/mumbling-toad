import React, { useState, useEffect, useRef } from 'react';
import { Box, useApp, useInput, useStdout } from 'ink';
import { Prompt } from './components/prompt.js';
import { Sidebar } from './components/sidebar.js';
import { StatusBar } from './components/status-bar.js';
import { Table } from './components/table.js';
import { CrawlEngine } from './crawler/engine.js';
import { CrawlStats, PageData, CrawlOptions, OnPageCrawled, OnStatsUpdate, OnCrawlComplete, OnCrawlError } from './crawler/types.js';
import { DEFAULT_CRAWL_OPTIONS } from './constants.js';

interface AppProps {
  initialUrl?: string;
}

type AppState = 'idle' | 'prompting' | 'crawling' | 'finished';

const INITIAL_STATS: CrawlStats = {
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

export const App: React.FC<AppProps> = ({ initialUrl }) => {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [state, setState] = useState<AppState>(initialUrl ? 'crawling' : 'prompting');
  const [stats, setStats] = useState<CrawlStats>(INITIAL_STATS);
  const [pages, setPages] = useState<PageData[]>([]);
  const [options] = useState<CrawlOptions>(DEFAULT_CRAWL_OPTIONS);
  const [targetUrl, setTargetUrl] = useState<string | undefined>(initialUrl);
  
  const engineRef = useRef<CrawlEngine | null>(null);
  const pageBuffer = useRef<PageData[]>([]);

  const termWidth = stdout?.columns || 120;

  // Batched page updates: Flush buffer every 200ms
  useEffect(() => {
    const interval = setInterval(() => {
      if (pageBuffer.current.length > 0) {
        setPages(prev => [...prev, ...pageBuffer.current]);
        pageBuffer.current = [];
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  // Engine callbacks
  const onPageCrawled: OnPageCrawled = (page) => {
    // Push to buffer, NOT to state
    pageBuffer.current.push(page);
  };

  const onStatsUpdate: OnStatsUpdate = (newStats) => {
    // Direct state update (already throttled by engine at 500ms)
    setStats(newStats);
  };

  const onCrawlComplete: OnCrawlComplete = () => {
    // Flush any remaining buffered pages
    if (pageBuffer.current.length > 0) {
      setPages(prev => [...prev, ...pageBuffer.current]);
      pageBuffer.current = [];
    }
    setState('finished');
  };

  const onCrawlError: OnCrawlError = (error, url) => {
    console.error('Crawl error:', error, url);
  };

  // Create and start engine when entering crawling state
  useEffect(() => {
    if (state === 'crawling' && targetUrl && !engineRef.current) {
      engineRef.current = new CrawlEngine(
        options,
        {
          onPageCrawled,
          onStatsUpdate,
          onCrawlComplete,
          onCrawlError
        }
      );

      engineRef.current.start(targetUrl);
    }

    // Cleanup on unmount
    return () => {
      if (engineRef.current) {
        engineRef.current.stop();
        engineRef.current = null;
      }
    };
  }, [state, targetUrl, options]);

  // Initialize start time if we start immediately
  useEffect(() => {
    if (initialUrl) {
      setStats(prev => ({ ...prev, startTime: Date.now() }));
    }
  }, [initialUrl]);

  // Global keyboard shortcuts (only active when not prompting)
  useInput((input, _key) => {
    if (input === 'q') {
      exit();
    }
  }, { isActive: state !== 'prompting' });

  const handleUrlSubmit = (url: string) => {
    setTargetUrl(url);
    setStats(prev => ({ ...prev, startTime: Date.now() }));
    setState('crawling');
  };

  if (state === 'prompting') {
    return (
      <Box width="100%" height="100%" alignItems="center" justifyContent="center">
        <Prompt onSubmit={handleUrlSubmit} />
      </Box>
    );
  }

  return (
    <Box flexDirection="column" width="100%" height="100%">
      <Box flexDirection="row" flexGrow={1}>
        <Table pages={pages} isFocused={true} terminalWidth={termWidth} />
        <Sidebar stats={stats} />
      </Box>

      <StatusBar />
    </Box>
  );
};
