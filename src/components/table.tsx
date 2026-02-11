import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import { PageData } from '../crawler/types.js';
import { COLUMN_DEFINITIONS } from '../constants.js';

export interface TableProps {
  pages: PageData[];
  isFocused: boolean;
  terminalWidth: number;
}

export const Table: React.FC<TableProps> = ({ pages, isFocused, terminalWidth }) => {
  const { stdout } = useStdout();
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);
  const [columnOffset, setColumnOffset] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);

  const TABLE_HEIGHT = stdout ? stdout.rows - 6 : 20;
  const VISIBLE_ROWS = Math.max(1, TABLE_HEIGHT - 3);
  const TABLE_WIDTH = Math.floor(terminalWidth * 0.7);

  const urlCol = COLUMN_DEFINITIONS.find(c => c.priority === 1)!;
  const otherCols = COLUMN_DEFINITIONS.filter(c => c.priority !== 1);
  
   const availableWidth = Math.max(0, TABLE_WIDTH - urlCol.minWidth - 2);
  let currentWidth = 0;
  const visibleOtherCols = [];
  let hasHiddenRight = false;

  const availableOtherCols = otherCols.slice(columnOffset);
  const hasHiddenLeft = columnOffset > 0;

   for (const col of availableOtherCols) {
     if (currentWidth + col.minWidth + 2 <= availableWidth) {
       visibleOtherCols.push(col);
       currentWidth += col.minWidth + 2;
    } else {
      hasHiddenRight = true;
      break;
    }
  }

  const visibleColumns = [urlCol, ...visibleOtherCols];

  useInput((input, key) => {
    if (!isFocused) return;

    if (key.upArrow) {
      setSelectedRowIndex(prev => Math.max(0, prev - 1));
    }
    else if (key.downArrow) {
      setSelectedRowIndex(prev => Math.min(pages.length - 1, prev + 1));
    }
    else if (key.leftArrow) {
      setColumnOffset(prev => Math.max(0, prev - 1));
    }
    else if (key.rightArrow) {
      const maxOffset = otherCols.length - 1;
      setColumnOffset(prev => Math.min(maxOffset, prev + 1));
    }
    else if (input === 'g') {
      setSelectedRowIndex(0);
    }
    else if (input === 'G') {
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
      case 'url':
        content = <Text {...textProps}>{truncate(String(val), width)}</Text>;
        break;
      case 'statusCode': {
        const code = Number(val);
        if (!isSelected) {
            if (code >= 200 && code < 300) textProps.color = 'green';
            else if (code >= 300 && code < 400) textProps.color = 'yellow';
            else if (code >= 400) textProps.color = 'red';
            else textProps.color = 'white';
        }
        content = <Text {...textProps}>{val}</Text>;
        break;
      }
      case 'isIndexable': {
        const text = val ? 'Yes' : 'No';
        if (!isSelected) {
            textProps.color = val ? 'green' : 'red';
        }
        content = <Text {...textProps}>{text}</Text>;
        break;
      }
      default:
        content = <Text {...textProps}>{truncate(String(val), width)}</Text>;
    }

     return (
       <Box width={width} key={colKey} paddingX={1}>
         {content}
       </Box>
     );
  };

  const visiblePages = pages.slice(scrollOffset, scrollOffset + VISIBLE_ROWS);
  const emptyRows = Math.max(0, VISIBLE_ROWS - visiblePages.length);

  return (
    <Box flexDirection="column" width={TABLE_WIDTH}>
       <Box borderStyle="single" borderTop={false} borderLeft={false} borderRight={false} borderColor="gray">
         {visibleColumns.map(col => (
           <Box key={col.key} width={col.minWidth} paddingX={1}>
             <Text bold>{col.label}</Text>
           </Box>
         ))}
       </Box>

      {visiblePages.map((page, idx) => {
        const globalIndex = scrollOffset + idx;
        const isSelected = globalIndex === selectedRowIndex;
        
        return (
          <Box key={page.url}>
            {visibleColumns.map(col => renderCell(page, col.key, col.minWidth, isSelected))}
          </Box>
        );
      })}

      {Array.from({ length: emptyRows }).map((_, i) => (
        <Box key={`empty-${i}`} height={1} />
      ))}

      <Box marginTop={1} justifyContent="space-between">
        <Text dimColor>
          {hasHiddenLeft ? '◄ ' : '  '}
          {visiblePages.length > 0 ? `${scrollOffset + 1}-${Math.min(pages.length, scrollOffset + VISIBLE_ROWS)} of ${pages.length}` : 'No pages'}
          {hasHiddenRight ? ' ►' : '  '}
        </Text>
      </Box>
    </Box>
  );
};
