import React from 'react';
import { Box, Text, useStdout } from 'ink';
import type { ConsoleMessage } from '../console-capture.js';

interface ConsolePanelProps {
  messages: ConsoleMessage[];
  visible: boolean;
  maxHeight?: number;
}

const DEFAULT_MAX_HEIGHT = 8;
const HEADER_HEIGHT = 3;
const HEADER_TITLE = 'Console';
const MESSAGE_PADDING = 1;
const MESSAGE_SPACING = 1;
const LEVEL_WIDTH = 6;

const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date
    .toTimeString()
    .split(' ')[0];
};

const truncate = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, Math.max(0, maxLength - 1))}…`;
};

const getLevelColor = (level: ConsoleMessage['level']): string => {
  if (level === 'error') {
    return 'red';
  }
  if (level === 'warn') {
    return 'yellow';
  }
  return 'white';
};

export const ConsolePanel: React.FC<ConsolePanelProps> = ({
  messages,
  visible,
  maxHeight = DEFAULT_MAX_HEIGHT,
}) => {
  const { stdout } = useStdout();

  if (!visible) {
    return null;
  }

  const terminalWidth = stdout?.columns || 120;
  const contentHeight = Math.max(1, maxHeight);
  const messageWindow = messages.slice(-contentHeight);
  const headerPadding = MESSAGE_PADDING * 2;
  const headerCount = messages.length.toString();
  const headerSpace = terminalWidth - HEADER_TITLE.length - headerCount.length - headerPadding;
  const timestampWidth = 8;
  const spacing = MESSAGE_SPACING * 2;
  const contentWidth = terminalWidth - headerPadding;
  const messageWidth = Math.max(10, contentWidth - timestampWidth - LEVEL_WIDTH - spacing);

  return (
    <Box
      flexDirection="column"
      width="100%"
      borderStyle="single"
      borderColor="gray"
      paddingX={MESSAGE_PADDING}
      paddingY={0}
    >
      <Box justifyContent="space-between">
        <Text bold>{HEADER_TITLE}</Text>
        <Text dimColor>{headerCount}</Text>
      </Box>
      <Box flexDirection="column" height={contentHeight + HEADER_HEIGHT - 2}>
        {messageWindow.map((message) => (
          <Box key={`${message.timestamp}-${message.message}`}>
            <Text dimColor>{formatTimestamp(message.timestamp)}</Text>
            <Text> </Text>
            <Text color={getLevelColor(message.level)}>
              {message.level.padEnd(LEVEL_WIDTH - 1)}
            </Text>
            <Text> </Text>
            <Text>{truncate(message.message, messageWidth)}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
