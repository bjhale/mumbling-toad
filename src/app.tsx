import React, { useState, useEffect } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { Prompt } from './components/prompt.js';
import { Sidebar } from './components/sidebar.js';
import { StatusBar } from './components/status-bar.js';
import { CrawlStats } from './crawler/types.js';

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
  const [state, setState] = useState<AppState>(initialUrl ? 'crawling' : 'prompting');
  const [stats, setStats] = useState<CrawlStats>(INITIAL_STATS);
  const [targetUrl, setTargetUrl] = useState<string | undefined>(initialUrl);

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
        {/* Left Main Area - Placeholder for Task 5 */}
        <Box width="70%" borderStyle="single" borderColor="gray" alignItems="center" justifyContent="center">
          <Text color="gray">Table placeholder (Task 5)</Text>
          <Box marginTop={1}>
            <Text>Target: {targetUrl}</Text>
          </Box>
        </Box>

        {/* Right Sidebar */}
        <Sidebar stats={stats} />
      </Box>

      {/* Status Bar */}
      <StatusBar />
    </Box>
  );
};
