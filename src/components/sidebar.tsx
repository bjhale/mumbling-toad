import React from 'react';
import { Box, Text } from 'ink';
import { CrawlStats } from '../crawler/types.js';

interface SidebarProps {
  stats: CrawlStats;
}

const formatDuration = (ms: number): string => {
  if (ms <= 0) return '00:00';
  const seconds = Math.floor(ms / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const Sidebar: React.FC<SidebarProps> = ({ stats }) => {
  const elapsedMs = stats.startTime > 0 ? Date.now() - stats.startTime : 0;
  const elapsedSeconds = elapsedMs / 1000;
  const pagesPerSecond = elapsedSeconds > 0 ? (stats.pagesCrawled / elapsedSeconds).toFixed(1) : '0.0';
  const avgResponseTime = stats.pagesCrawled > 0 
    ? Math.round(stats.totalResponseTimeMs / stats.pagesCrawled) 
    : 0;

  const statusCodesString = Object.entries(stats.statusCodes)
    .map(([code, count]) => `${code}: ${count}`)
    .join(', ') || 'None';

  return (
    <Box 
      flexDirection="column" 
      width="30%" 
      minWidth={35}
      borderStyle="single" 
      borderColor="white" 
      paddingX={1}
    >
      <Box justifyContent="center" marginBottom={1}>
        <Text bold>Crawl Statistics</Text>
      </Box>
      <Box justifyContent="space-between">
        <Text>Pages Crawled:</Text>
        <Text bold color="green">{stats.pagesCrawled}</Text>
      </Box>
      
      <Box justifyContent="space-between">
        <Text>Pages in Queue:</Text>
        <Text bold color="yellow">{stats.pagesInQueue}</Text>
      </Box>
      
      <Box justifyContent="space-between">
        <Text>Errors:</Text>
        <Text bold color={stats.errors > 0 ? 'red' : 'green'}>{stats.errors}</Text>
      </Box>
      
      <Box marginY={1} borderStyle="single" borderTop={false} borderLeft={false} borderRight={false} borderColor="gray" />

      <Box justifyContent="space-between">
        <Text>Elapsed Time:</Text>
        <Text>{formatDuration(elapsedMs)}</Text>
      </Box>
      
      <Box justifyContent="space-between">
        <Text>Pages/Second:</Text>
        <Text>{pagesPerSecond}</Text>
      </Box>
      
      <Box justifyContent="space-between">
        <Text>Avg Response:</Text>
        <Text>{avgResponseTime}ms</Text>
      </Box>

      <Box marginY={1} borderStyle="single" borderTop={false} borderLeft={false} borderRight={false} borderColor="gray" />

      <Box justifyContent="space-between">
        <Text>Unique URLs:</Text>
        <Text>{stats.uniqueUrlsFound}</Text>
      </Box>

      <Box justifyContent="space-between">
        <Text>Indexable:</Text>
        <Text color="green">{stats.indexableCount}</Text>
      </Box>

      <Box justifyContent="space-between">
        <Text>Non-Indexable:</Text>
        <Text color="yellow">{stats.nonIndexableCount}</Text>
      </Box>
      
      <Box marginTop={1}>
        <Text dimColor>Status Codes:</Text>
      </Box>
      <Box>
        <Text color="blue">{statusCodesString}</Text>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>Content Types:</Text>
      </Box>
      {Object.entries(stats.contentTypes)
        .sort(([, a], [, b]) => b - a)
        .map(([type, count]) => (
          <Box key={type} justifyContent="space-between">
            <Text>{type}</Text>
            <Text color="cyan">{count}</Text>
          </Box>
        ))}
    </Box>
  );
};
