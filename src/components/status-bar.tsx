import React from 'react';
import { Box, Text } from 'ink';

interface StatusBarProps {
  exportMessage?: string;
  errorMessage?: string;
  messageCount?: number;
  consoleOpen?: boolean;
  hasErrorMessages?: boolean;
  isPaused?: boolean;
}

const BADGE_PADDING = 1;
const ACTIVE_BADGE_PADDING = 0;

export const StatusBar: React.FC<StatusBarProps> = ({
  exportMessage = '',
  errorMessage = '',
  messageCount = 0,
  consoleOpen = false,
  hasErrorMessages = false,
  isPaused = false,
}) => {
  const pauseHint = isPaused ? 'p Resume' : 'p Pause';
  const defaultHints = `↑↓ Scroll | ←→ Columns | Tab Switch | ${pauseHint} | c Console | o Options | e Export | q Quit`;
  const displayMessage = errorMessage || exportMessage || (isPaused ? 'PAUSED — press p to resume' : defaultHints);
  const color = errorMessage ? 'red' : isPaused ? 'yellow' : undefined;
  const showBadge = messageCount > 0;
  const badgeColor = hasErrorMessages ? 'yellow' : 'cyan';

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
        {showBadge && (
          <Text
            color={badgeColor}
            inverse={consoleOpen}
            bold={consoleOpen}
          >
            {[
              '[',
              `C: ${messageCount}`,
              ']'
            ].join('')}
          </Text>
        )}
        {showBadge && <Text>{' '.repeat(consoleOpen ? ACTIVE_BADGE_PADDING : BADGE_PADDING)}</Text>}
        {displayMessage}
      </Text>
    </Box>
  );
};
