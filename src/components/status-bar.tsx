import React from 'react';
import { Box, Text } from 'ink';

interface StatusBarProps {
  exportMessage?: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({ exportMessage = '' }) => {
  return (
    <Box 
      width="100%" 
      borderStyle="single" 
      borderLeft={false} 
      borderRight={false} 
      borderBottom={false} 
      borderColor="gray" 
      paddingX={1}
    >
      <Text dimColor>
        {exportMessage || '↑↓ Scroll | ←→ Columns | o Options | e Export | q Quit'}
      </Text>
    </Box>
  );
};
