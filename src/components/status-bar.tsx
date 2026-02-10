import React from 'react';
import { Box, Text } from 'ink';

export const StatusBar: React.FC = () => {
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
        ↑↓ Scroll | ←→ Columns | o Options | e Export | q Quit
      </Text>
    </Box>
  );
};
