import React, { useState, useEffect, useRef } from 'react';
import { Box, useApp, useInput, useStdout, Text as InkText } from 'ink';
import { Prompt } from './components/prompt.js';
import { Sidebar } from './components/sidebar.js';
import { StatusBar } from './components/status-bar.js';
import { Table, type TableHandle } from './components/table.js';
import { Options } from './components/options.js';
import { ConsolePanel } from './components/console-panel.js';
import { CrawlEngine } from './crawler/engine.js';
import { CrawlStats, PageData, CrawlOptions, OnPageCrawled, OnStatsUpdate, OnCrawlComplete, OnCrawlError } from './crawler/types.js';
import { DEFAULT_CRAWL_OPTIONS } from './constants.js';
import { exportResults } from './export/index.js';
import { ConsoleMessage, startCapture, stopCapture } from './console-capture.js';
import { useMouse } from './hooks/use-mouse.js';
import { type MouseEvent } from './mouse-parser.js';

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
  contentTypes: {},
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
  const [promptValue, setPromptValue] = useState('');
  const [promptOptionsOpen, setPromptOptionsOpen] = useState(false);
  const [targetUrl, setTargetUrl] = useState<string | undefined>(initialUrl);
   const [exportMessage, setExportMessage] = useState<string>('');
   const [errorMessage, setErrorMessage] = useState<string>('');
   const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);
   const [consoleOpen, setConsoleOpen] = useState(false);
   const [isPaused, setIsPaused] = useState(false);
  
   const engineRef = useRef<CrawlEngine | null>(null);
   const pageBuffer = useRef<PageData[]>([]);
   const flushIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
   const tableRef = useRef<TableHandle | null>(null);

  const termWidth = stdout?.columns || 120;
  const MIN_WIDTH = 100;

  const CONSOLE_PANEL_HEIGHT = 11;
  const STATUS_BAR_HEIGHT = 2;
  const tableAvailableHeight = (stdout?.rows || 24) - 6;

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
        const batch = pageBuffer.current.splice(0);
        setPages(prev => [...prev, ...batch]);
      }
    }, 200);
    
    flushIntervalRef.current = interval;

    return () => {
      if (flushIntervalRef.current) {
        clearInterval(flushIntervalRef.current);
      }
    };
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

   const onCrawlComplete: OnCrawlComplete = (_pages, _stats) => {
     // Clear the flush interval to prevent double-flush
     if (flushIntervalRef.current) {
       clearInterval(flushIntervalRef.current);
       flushIntervalRef.current = null;
     }
     
     // Final flush of any remaining buffered pages
     const remaining = pageBuffer.current.splice(0);
     if (remaining.length > 0) {
       setPages(prev => [...prev, ...remaining]);
     }
     
     setIsPaused(false);
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
        engineRef.current.abort();
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
      engineRef.current.abort();
    }
    
    exit();
  };

  useEffect(() => {
    const sigintHandler = () => {
      process.stdout.write('\x1b[?1003l\x1b[?1006l');
      handleShutdown();
    };
    
    const uncaughtHandler = (error: Error) => {
      process.stdout.write('\x1b[?1003l\x1b[?1006l');
      console.error('Uncaught exception:', error);
      process.exit(1);
    };
    
    process.on('SIGINT', sigintHandler);
    process.on('SIGTERM', sigintHandler);
    process.on('uncaughtException', uncaughtHandler);
    
    return () => {
      process.removeListener('SIGINT', sigintHandler);
      process.removeListener('SIGTERM', sigintHandler);
      process.removeListener('uncaughtException', uncaughtHandler);
    };
  }, []);

  const mouseActive = state !== 'prompting' && !optionsOpen && !promptOptionsOpen;
  useEffect(() => {
    if (mouseActive) {
      process.stdout.write('\x1b[?1003h\x1b[?1006h');
    } else {
      process.stdout.write('\x1b[?1003l\x1b[?1006l');
    }
    return () => {
      process.stdout.write('\x1b[?1003l\x1b[?1006l');
    };
  }, [mouseActive]);

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
     if (input === 'p' && engineRef.current) {
       engineRef.current.togglePause();
       setIsPaused(engineRef.current.isPaused);
     }
   }, { isActive: state !== 'prompting' && !optionsOpen });

  const handleMouse = (event: MouseEvent) => {
    if (event.type === 'wheel') {
      if (tableRef.current) {
        const delta = event.button === 64 ? -1 : 1;
        tableRef.current.adjustScroll(delta);
      }
      return;
    }

    if (state !== 'crawling') return;

    if (event.type === 'press') {
      const statusBarY = (stdout?.rows || 24) - 2;
      if (event.y >= statusBarY) {
        const hintsText = `↑↓ Scroll | ←→ Columns | ${isPaused ? 'p Resume' : 'p Pause'} | c Console | o Options | e Export | q Quit`;
        
        if (hintsText.includes('p Resume') || hintsText.includes('p Pause')) {
          const pauseIndex = hintsText.indexOf('p ');
          if (event.x >= pauseIndex + 30 && event.x <= pauseIndex + 50) {
            if (engineRef.current) {
              engineRef.current.togglePause();
              setIsPaused(engineRef.current.isPaused);
            }
          }
        }
        
        if (hintsText.includes('c Console')) {
          const consoleIndex = hintsText.indexOf('c Console');
          if (event.x >= consoleIndex + 30 && event.x <= consoleIndex + 50) {
            setConsoleOpen(prev => !prev);
          }
        }
        
        if (hintsText.includes('o Options')) {
          const optionsIndex = hintsText.indexOf('o Options');
          if (event.x >= optionsIndex + 30 && event.x <= optionsIndex + 50) {
            setOptionsOpen(true);
          }
        }
        
        if (hintsText.includes('e Export')) {
          const exportIndex = hintsText.indexOf('e Export');
          if (event.x >= exportIndex + 30 && event.x <= exportIndex + 50) {
            if (pages.length > 0) {
              const { csvPath } = exportResults(pages, stats, targetUrl || 'crawl');
              const csvName = csvPath.split('/').pop();
              setExportMessage(`Exported to ${csvName}`);
              setTimeout(() => setExportMessage(''), 3000);
            }
          }
        }
        
        if (hintsText.includes('q Quit')) {
          const quitIndex = hintsText.indexOf('q Quit');
          if (event.x >= quitIndex + 30) {
            handleShutdown();
          }
        }
      }
    }
  };

  useMouse({
    isActive: mouseActive,
    onMouseEvent: handleMouse,
  });

  const handleUrlSubmit = (url: string) => {
    setTargetUrl(url);
    setStats(prev => ({ ...prev, startTime: Date.now() }));
    setState('crawling');
  };

  if (state === 'prompting') {
    if (promptOptionsOpen) {
      return (
        <Options
          options={options}
          onClose={(updated) => {
            setOptions(updated);
            setPromptOptionsOpen(false);
          }}
          isActive={promptOptionsOpen}
        />
      );
    }
    
    return (
      <Box width="100%" height="100%" alignItems="center" justifyContent="center">
        <Prompt
          onSubmit={handleUrlSubmit}
          onOpenOptions={() => setPromptOptionsOpen(true)}
          onQuit={() => exit()}
          initialValue={promptValue}
          isActive={!promptOptionsOpen}
          onValueChange={setPromptValue}
        />
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
      <Box flexDirection="row" flexGrow={1} overflowY="hidden">
        <Table ref={tableRef} pages={pages} isFocused={!optionsOpen && true} terminalWidth={termWidth} availableHeight={tableAvailableHeight} />
        <Sidebar stats={stats} />
      </Box>

       {consoleOpen && (
         <Box position="absolute" marginTop={(stdout?.rows || 24) - CONSOLE_PANEL_HEIGHT - STATUS_BAR_HEIGHT} width="100%">
           <ConsolePanel messages={consoleMessages} visible={true} />
         </Box>
       )}
       <StatusBar
         exportMessage={exportMessage}
         errorMessage={errorMessage}
         messageCount={consoleMessages.length}
         consoleOpen={consoleOpen}
         hasErrorMessages={consoleMessages.some(message => message.level === 'error')}
         isPaused={isPaused}
       />
    </Box>
  );
};
