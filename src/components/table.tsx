import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import { PageData } from '../crawler/types.js';
import { COLUMN_DEFINITIONS } from '../constants.js';
import { computeScrollbar } from '../scrollbar.js';

export interface TableProps {
  pages: PageData[];
  isFocused: boolean;
  terminalWidth: number;
  availableHeight?: number;
}

export interface TableHandle {
  adjustScroll: (delta: number) => void;
}

export const Table = forwardRef<TableHandle, TableProps>(({ pages, isFocused, terminalWidth, availableHeight }, ref) => {
  const { stdout } = useStdout();
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);
  const [columnOffset, setColumnOffset] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [autoFollow, setAutoFollow] = useState(true);

  const TABLE_HEIGHT = availableHeight !== undefined ? availableHeight : (stdout ? stdout.rows - 6 : 20);
  const VISIBLE_ROWS = Math.max(1, TABLE_HEIGHT - 5);
  const TABLE_WIDTH = Math.floor(terminalWidth * 0.7);
  const SCROLLBAR_WIDTH = 1;

  const urlColDef = COLUMN_DEFINITIONS.find(c => c.priority === 1)!;
  const otherCols = COLUMN_DEFINITIONS.filter(c => c.priority !== 1);
  
  const contentWidth = TABLE_WIDTH - (pages.length > VISIBLE_ROWS ? SCROLLBAR_WIDTH : 0);
  const availableForOthers = Math.max(0, contentWidth - urlColDef.minWidth);
  let usedByOthers = 0;
  const visibleOtherCols = [];
  let hasHiddenRight = false;

  const availableOtherCols = otherCols.slice(columnOffset);
  const hasHiddenLeft = columnOffset > 0;

  for (const col of availableOtherCols) {
    if (usedByOthers + col.minWidth <= availableForOthers) {
      visibleOtherCols.push(col);
      usedByOthers += col.minWidth;
    } else {
      hasHiddenRight = true;
      break;
    }
  }

  // URL column expands to fill whatever space the other columns don't use
  const urlColWidth = Math.max(urlColDef.minWidth, contentWidth - usedByOthers);
  const urlCol = { ...urlColDef, minWidth: urlColWidth };
  const visibleColumns = [urlCol, ...visibleOtherCols];

  useInput((input, key) => {
    if (!isFocused) return;

    if (key.upArrow) {
      setAutoFollow(false);
      setSelectedRowIndex(prev => Math.max(0, prev - 1));
    }
    else if (key.downArrow) {
      setSelectedRowIndex(prev => {
        const next = Math.min(pages.length - 1, prev + 1);
        if (next >= pages.length - 1) setAutoFollow(true);
        return next;
      });
    }
    else if (key.leftArrow) {
      setColumnOffset(prev => Math.max(0, prev - 1));
    }
    else if (key.rightArrow) {
      if (hasHiddenRight) {
        setColumnOffset(prev => prev + 1);
      }
    }
    else if (input === 'g') {
      setAutoFollow(false);
      setSelectedRowIndex(0);
    }
    else if (input === 'G') {
      setAutoFollow(true);
      setSelectedRowIndex(pages.length - 1);
    }
    else if (input === 'f' && !autoFollow) {
      setAutoFollow(true);
      setSelectedRowIndex(pages.length - 1);
    }
  }, { isActive: isFocused });

  useEffect(() => {
    if (selectedRowIndex < scrollOffset) {
      setScrollOffset(selectedRowIndex);
    } else if (selectedRowIndex >= scrollOffset + VISIBLE_ROWS) {
      setScrollOffset(selectedRowIndex - VISIBLE_ROWS + 1);
    }
  }, [selectedRowIndex, scrollOffset, VISIBLE_ROWS]);

  // Auto-follow: snap to bottom when new pages arrive
  useEffect(() => {
    if (autoFollow && pages.length > 0) {
      setSelectedRowIndex(pages.length - 1);
    }
  }, [autoFollow, pages.length]);

  useImperativeHandle(ref, () => ({
    adjustScroll: (delta: number) => {
      if (delta < 0) setAutoFollow(false);
      setSelectedRowIndex(prev => {
        const next = Math.max(0, Math.min(pages.length - 1, prev + delta));
        if (next >= pages.length - 1) setAutoFollow(true);
        return next;
      });
    }
  }), [pages.length]);

  const renderCell = (page: PageData, colKey: string, width: number, isSelected: boolean) => {
    let content: React.ReactNode = '';
    const val = page[colKey as keyof PageData];

    const truncate = (str: string, max: number) => {
      if (str.length <= max) return str;
      return str.slice(0, max - 1) + '…';
    };

    const bg = isSelected ? 'blue' : undefined;
    const textProps: any = { backgroundColor: bg };

    if (isSelected) {
       textProps.color = 'white';
    }

    switch (colKey) {
      case 'url': {
        let displayUrl = String(val);
        try {
          const parsed = new URL(displayUrl);
          displayUrl = parsed.pathname + parsed.search + parsed.hash;
        } catch {}
        content = <Text {...textProps} wrap="truncate">{truncate(displayUrl, width)}</Text>;
        break;
      }
      case 'statusCode': {
        const code = Number(val);
        if (!isSelected) {
            if (code >= 200 && code < 300) textProps.color = 'green';
            else if (code >= 300 && code < 400) textProps.color = 'yellow';
            else if (code >= 400) textProps.color = 'red';
            else textProps.color = 'white';
        }
        content = <Text {...textProps} wrap="truncate">{val}</Text>;
        break;
      }
      case 'isIndexable': {
        const text = val ? 'Yes' : 'No';
        if (!isSelected) {
            textProps.color = val ? 'green' : 'red';
        }
        content = <Text {...textProps} wrap="truncate">{text}</Text>;
        break;
      }
      default:
        content = <Text {...textProps} wrap="truncate">{truncate(String(val), width)}</Text>;
    }

     return (
       <Box width={width} key={colKey} paddingX={1}>
          {content}
        </Box>
      );
  };

  const visiblePages = pages.slice(scrollOffset, scrollOffset + VISIBLE_ROWS);
  const emptyRows = Math.max(0, VISIBLE_ROWS - visiblePages.length);
  const showScrollbar = pages.length > VISIBLE_ROWS;

  return (
    <Box flexDirection="column" width={TABLE_WIDTH} height={TABLE_HEIGHT} overflowY="hidden">
       <Box justifyContent="center">
         <Text bold underline={isFocused}>Crawled Pages</Text>
       </Box>
       <Box borderStyle="single" borderTop={false} borderLeft={false} borderRight={false} borderColor={isFocused ? 'cyan' : 'gray'}>
          <Box flexGrow={1}>
            {visibleColumns.map(col => (
              <Box key={col.key} width={col.minWidth} paddingX={1}>
                <Text bold>{col.label}</Text>
              </Box>
            ))}
          </Box>
          {showScrollbar && <Box width={SCROLLBAR_WIDTH}></Box>}
        </Box>

       {visiblePages.map((page, idx) => {
         const globalIndex = scrollOffset + idx;
         const isSelected = globalIndex === selectedRowIndex;
         
         return (
            <Box key={page.url} height={1}>
             <Box flexGrow={1}>
               {visibleColumns.map(col => renderCell(page, col.key, col.minWidth, isSelected))}
             </Box>
             {showScrollbar && (
               <Box width={SCROLLBAR_WIDTH}>
                 {(() => {
                   const scrollbar = computeScrollbar({
                     totalRows: pages.length,
                     visibleRows: VISIBLE_ROWS,
                     scrollOffset,
                     trackHeight: VISIBLE_ROWS
                   });
                   const char = idx >= scrollbar.thumbStart && idx < scrollbar.thumbEnd ? '█' : '░';
                   return <Text color="gray">{char}</Text>;
                 })()}
               </Box>
             )}
           </Box>
         );
       })}

       {Array.from({ length: emptyRows }).map((_, i) => (
         <Box key={`empty-${i}`} height={1}>
           <Box flexGrow={1} />
           {showScrollbar && <Box width={SCROLLBAR_WIDTH}></Box>}
         </Box>
       ))}

      <Box marginTop={1} justifyContent="space-between">
        <Text dimColor>
          {hasHiddenLeft ? '◄ ' : '  '}
          {visiblePages.length > 0 ? `${scrollOffset + 1}-${Math.min(pages.length, scrollOffset + VISIBLE_ROWS)} of ${pages.length}` : 'No pages'}
          {hasHiddenRight ? ' ►' : '  '}
        </Text>
        {autoFollow ? <Text color="cyan">⬇ Following</Text> : <Text dimColor>f Follow</Text>}
      </Box>
    </Box>
  );
});
