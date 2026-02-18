import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Box, Text, useInput } from 'ink';
import { CrawlStats } from '../crawler/types.js';
import { computeScrollbar } from '../scrollbar.js';

interface SidebarProps {
  stats: CrawlStats;
  isFocused?: boolean;
  availableHeight?: number;
}

export interface SidebarHandle {
  adjustScroll: (delta: number) => void;
}

const formatDuration = (ms: number): string => {
  if (ms <= 0) return '00:00';
  const seconds = Math.floor(ms / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

interface StatRow {
  type: 'pair' | 'separator' | 'label' | 'value';
  label?: string;
  value?: string;
  valueColor?: string;
  valueBold?: boolean;
  labelDim?: boolean;
}

function buildStatRows(stats: CrawlStats): StatRow[] {
  const elapsedMs = stats.startTime > 0
    ? Date.now() - stats.startTime - stats.pausedDurationMs
    : 0;
  const elapsedSeconds = elapsedMs / 1000;
  const pagesPerSecond = elapsedSeconds > 0 ? (stats.pagesCrawled / elapsedSeconds).toFixed(1) : '0.0';
  const avgResponseTime = stats.pagesCrawled > 0
    ? Math.round(stats.totalResponseTimeMs / stats.pagesCrawled)
    : 0;

  const statusCodesString = Object.entries(stats.statusCodes)
    .map(([code, count]) => `${code}: ${count}`)
    .join(', ') || 'None';

  const rows: StatRow[] = [
    { type: 'pair', label: 'Pages Crawled:', value: String(stats.pagesCrawled), valueColor: 'green', valueBold: true },
    { type: 'pair', label: 'Pages in Queue:', value: String(stats.pagesInQueue), valueColor: 'yellow', valueBold: true },
    { type: 'pair', label: 'Errors:', value: String(stats.errors), valueColor: stats.errors > 0 ? 'red' : 'green', valueBold: true },
    { type: 'separator' },
    { type: 'pair', label: 'Elapsed Time:', value: formatDuration(elapsedMs) },
    { type: 'pair', label: 'Pages/Second:', value: pagesPerSecond },
    { type: 'pair', label: 'Avg Response:', value: `${avgResponseTime}ms` },
    { type: 'separator' },
    { type: 'pair', label: 'Unique URLs:', value: String(stats.uniqueUrlsFound) },
    { type: 'pair', label: 'Indexable:', value: String(stats.indexableCount), valueColor: 'green' },
    { type: 'pair', label: 'Non-Indexable:', value: String(stats.nonIndexableCount), valueColor: 'yellow' },
    { type: 'label', label: 'Status Codes:', labelDim: true },
    { type: 'value', value: statusCodesString, valueColor: 'blue' },
    { type: 'label', label: 'Content Types:', labelDim: true },
  ];

  const contentTypeEntries = Object.entries(stats.contentTypes).sort(([, a], [, b]) => b - a);
  for (const [type, count] of contentTypeEntries) {
    rows.push({ type: 'pair', label: type, value: String(count), valueColor: 'cyan' });
  }

  return rows;
}

const SCROLLBAR_WIDTH = 1;
const TITLE_HEIGHT = 2;
const BORDER_HEIGHT = 2;

export const Sidebar = forwardRef<SidebarHandle, SidebarProps>(({ stats, isFocused = false, availableHeight }, ref) => {
  const [scrollOffset, setScrollOffset] = useState(0);

  const rows = buildStatRows(stats);
  const totalRows = rows.length;

  const innerHeight = availableHeight !== undefined
    ? availableHeight - BORDER_HEIGHT - TITLE_HEIGHT
    : totalRows;
  const visibleRows = Math.max(1, innerHeight);
  const needsScroll = totalRows > visibleRows;
  const maxScroll = Math.max(0, totalRows - visibleRows);

  useEffect(() => {
    if (scrollOffset > maxScroll) {
      setScrollOffset(maxScroll);
    }
  }, [maxScroll, scrollOffset]);

  useInput((_input, key) => {
    if (!isFocused) return;
    if (key.upArrow) {
      setScrollOffset(prev => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setScrollOffset(prev => Math.min(maxScroll, prev + 1));
    }
  }, { isActive: isFocused });

  useImperativeHandle(ref, () => ({
    adjustScroll: (delta: number) => {
      setScrollOffset(prev => Math.max(0, Math.min(maxScroll, prev + delta)));
    }
  }), [maxScroll]);

  const visibleSlice = rows.slice(scrollOffset, scrollOffset + visibleRows);

  const renderRow = (row: StatRow, idx: number) => {
    const key = `row-${scrollOffset + idx}`;
    switch (row.type) {
      case 'separator':
        return <Box key={key} marginY={1} borderStyle="single" borderTop={false} borderLeft={false} borderRight={false} borderColor="gray" />;
      case 'label':
        return (
          <Box key={key} marginTop={1}>
            <Text dimColor={row.labelDim}>{row.label}</Text>
          </Box>
        );
      case 'value':
        return (
          <Box key={key}>
            <Text color={row.valueColor}>{row.value}</Text>
          </Box>
        );
      case 'pair':
        return (
          <Box key={key} justifyContent="space-between">
            <Text>{row.label}</Text>
            <Text bold={row.valueBold} color={row.valueColor}>{row.value}</Text>
          </Box>
        );
    }
  };

  return (
    <Box
      flexDirection="column"
      width="30%"
      minWidth={35}
      borderStyle="single"
      borderColor={isFocused ? 'cyan' : 'white'}
      paddingX={1}
      overflowY="hidden"
    >
      <Box justifyContent="center" marginBottom={1}>
        <Text bold underline={isFocused}>Crawl Statistics</Text>
      </Box>
      <Box flexDirection="row" flexGrow={1} overflowY="hidden">
        <Box flexDirection="column" flexGrow={1} overflowY="hidden">
          {visibleSlice.map(renderRow)}
        </Box>
        {needsScroll && (
          <Box flexDirection="column" width={SCROLLBAR_WIDTH} marginLeft={1}>
            {Array.from({ length: visibleRows }).map((_, idx) => {
              const scrollbar = computeScrollbar({
                totalRows,
                visibleRows,
                scrollOffset,
                trackHeight: visibleRows,
              });
              const isThumb = idx >= scrollbar.thumbStart && idx < scrollbar.thumbEnd;
              return <Text key={`track-${idx}`} color="gray">{isThumb ? '█' : '░'}</Text>;
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
});
