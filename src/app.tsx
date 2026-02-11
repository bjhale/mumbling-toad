import React, { useState, useEffect, useRef } from 'react';
import { Box, useApp, useInput, useStdout, Text as InkText } from 'ink';
import { Prompt } from './components/prompt.js';
import { Sidebar } from './components/sidebar.js';
import { StatusBar } from './components/status-bar.js';
import { Table } from './components/table.js';
import { Options } from './components/options.js';
import { ConsolePanel } from './components/console-panel.js';
import { CrawlEngine } from './crawler/engine.js';
import { CrawlStats, PageData, CrawlOptions, OnPageCrawled, OnStatsUpdate, OnCrawlComplete, OnCrawlError } from './crawler/types.js';
import { DEFAULT_CRAWL_OPTIONS } from './constants.js';
import { exportResults } from './export/index.js';
import { ConsoleMessage, startCapture, stopCapture } from './console-capture.js';

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
  const [options, setOptions] = useState<CrawlOptions>(DEFAULT_CRAWL_OPTIONS);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [targetUrl, setTargetUrl] = useState<string | undefined>(initialUrl);
  const [exportMessage, setExportMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);
  const [consoleOpen, setConsoleOpen] = useState(false);
  
  const engineRef = useRef<CrawlEngine | null>(null);
  const pageBuffer = useRef<PageData[]>([]);

  const termWidth = stdout?.columns || 120;
  const MIN_WIDTH = 100;

  if (termWidth < MIN_WIDTH && state !== 'prompting') {
    return (
      <Box padding={2}>
        <InkText color="yellow">
          Terminal too narrow ({termWidth} columns). Please resize to at least {MIN_WIDTH} columns.
        </InkText>
      </Box>
    );
  }

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

  const onCrawlComplete: OnCrawlComplete = (pages, stats) => {
    if (pageBuffer.current.length > 0) {
      setPages(prev => [...prev, ...pageBuffer.current]);
      pageBuffer.current = [];
    }
    if (targetUrl) {
      const { csvPath } = exportResults(pages, stats, targetUrl);
      const csvName = csvPath.split('/').pop();
      setExportMessage(`Auto-exported to ${csvName}`);
      setTimeout(() => setExportMessage(''), 3000);
    }
    setState('finished');
  };

  const onCrawlError: OnCrawlError = (error, url) => {
    const message = `Error crawling ${url}: ${error.message}`;
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(''), 5000);
    setConsoleMessages(prev => [...prev, {
      timestamp: Date.now(),
      level: 'error',
      message,
    } as ConsoleMessage].slice(-100));
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
          onCrawlError,
          onLogMessage: (level, message) => {
            const normalized = level.toLowerCase();
            const mappedLevel: ConsoleMessage['level'] = normalized === 'error'
              ? 'error'
              : normalized === 'warning'
                ? 'warn'
                : 'log';
            setConsoleMessages(prev => [...prev, {
              timestamp: Date.now(),
              level: mappedLevel,
              message,
            }].slice(-100));
          },
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

  const handleShutdown = () => {
    if (engineRef.current) {
      engineRef.current.stop();
    }
    
    if (pages.length > 0) {
      exportResults(pages, stats, targetUrl || 'crawl');
    }
    
    exit();
  };

  useEffect(() => {
    const sigintHandler = () => handleShutdown();
    process.on('SIGINT', sigintHandler);
    process.on('SIGTERM', sigintHandler);
    
    return () => {
      process.removeListener('SIGINT', sigintHandler);
      process.removeListener('SIGTERM', sigintHandler);
    };
  }, []);

  useEffect(() => {
    startCapture((msg) => {
      setConsoleMessages(prev => [...prev, msg].slice(-100));
    });

    return () => {
      stopCapture();
    };
  }, []);

  useInput((input, _key) => {
    if (input === 'q') {
      handleShutdown();
    }
    if (input === 'e' && pages.length > 0) {
      const { csvPath } = exportResults(pages, stats, targetUrl || 'crawl');
      const csvName = csvPath.split('/').pop();
      setExportMessage(`Exported to ${csvName}`);
      setTimeout(() => setExportMessage(''), 3000);
    }
    if (input === 'o' && !optionsOpen) {
      setOptionsOpen(true);
    }
    if (input === 'c') {
      setConsoleOpen(prev => !prev);
    }
  }, { isActive: state !== 'prompting' && !optionsOpen });

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

  if (optionsOpen) {
    return (
      <Options 
        options={options} 
        onClose={(updated) => { setOptions(updated); setOptionsOpen(false); }}
        isActive={optionsOpen}
      />
    );
  }

  return (
    <Box flexDirection="column" width="100%" height="100%">
      <Box flexDirection="row" flexGrow={1}>
        <Table pages={pages} isFocused={!optionsOpen && true} terminalWidth={termWidth} />
        <Sidebar stats={stats} />
      </Box>

      <ConsolePanel messages={consoleMessages} visible={consoleOpen} />
      <StatusBar
        exportMessage={exportMessage}
        errorMessage={errorMessage}
        messageCount={consoleMessages.length}
        consoleOpen={consoleOpen}
        hasErrorMessages={consoleMessages.some(message => message.level === 'error')}
      />
    </Box>
  );
};
