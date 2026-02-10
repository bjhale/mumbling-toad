import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

interface PromptProps {
  onSubmit: (url: string) => void;
}

export const Prompt: React.FC<PromptProps> = ({ onSubmit }) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  useInput((input, key) => {
    if (key.return) {
      if (!value.trim()) {
        setError('Please enter a URL');
        return;
      }
      
      let url = value.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      onSubmit(url);
      return;
    }

    if (key.backspace || key.delete) {
      setValue(prev => prev.slice(0, -1));
      setError(null);
      return;
    }

    // Ignore specialized keys
    if (key.upArrow || key.downArrow || key.leftArrow || key.rightArrow || key.ctrl || key.meta) {
      return;
    }

    setValue(prev => prev + input);
    setError(null);
  });

  return (
    <Box flexDirection="column" padding={1} borderStyle="round" borderColor="cyan">
      <Text bold color="cyan">SEO Crawler Target</Text>
      <Box marginTop={1}>
        <Text color="green">❯ </Text>
        <Text>{value}</Text>
        <Text color="gray" dimColor>_</Text>
      </Box>
      {error && (
        <Box marginTop={1}>
          <Text color="red">! {error}</Text>
        </Box>
      )}
      <Box marginTop={1}>
        <Text color="gray" dimColor>Type domain and press Enter (e.g., example.com)</Text>
      </Box>
    </Box>
  );
};
