import React from 'react';
import { Box, Text } from 'ink';

interface StatusBarProps {
  exportMessage?: string;
  errorMessage?: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({ exportMessage = '', errorMessage = '' }) => {
  const displayMessage = errorMessage || exportMessage || '↑↓ Scroll | ←→ Columns | o Options | e Export | q Quit';
  const color = errorMessage ? 'red' : undefined;
  
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
      <Text dimColor color={color}>
        {displayMessage}
      </Text>
    </Box>
  );
};
