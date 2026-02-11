import React, { useState } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import { validateUrl, normalizeUrl } from '../utils.js';

interface PromptProps {
  onSubmit: (url: string) => void;
}

const SPLASH_ART = [
  '                     \\  |  /                     ',
  '                      \\ | /                      ',
  '                     _ \\|/ _                     ',
  '                q   (       )   p                ',
  '                 \\  / .   . \\  /                 ',
  '                  \\/    v    \\/                  ',
  '                   \\  _____  /                   ',
  '                    \\/     \\/                    ',
  '                                                 ',
  '     __  __                 _     _ _            ',
  '    |  \\/  |_   _ _ __ ___ | |__ | (_)_ __       ',
  '    | |\\/| | | | | \'_ ` _ \\| \'_ \\| | | \'_ \\      ',
  '    | |  | | |_| | | | | | | |_) | | | | | |     ',
  '    |_|  |_|\\__,_|_| |_| |_|_.__/|_|_|_| |_|     ',
  '        _____                _                   ',
  '       |_   _|__   __ _   __| |                  ',
  '         | |/ _ \\ / _` | / _` |                  ',
  '         | | (_) | (_| || (_| |                  ',
  '         |_|\\___/ \\__,_| \\__,_|                  ',
  '                                                 '
];

export const Prompt: React.FC<PromptProps> = ({ onSubmit }) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { stdout } = useStdout();
  
  const termHeight = stdout?.rows || 24;
  const showSplash = termHeight > 25;

  useInput((input, key) => {
    if (key.return) {
      if (!value.trim()) {
        setError('Please enter a URL');
        return;
      }
      
      const validation = validateUrl(value);
      if (!validation.valid) {
        setError(validation.error || 'Invalid URL');
        return;
      }
      
      const normalized = normalizeUrl(value);
      onSubmit(normalized);
      return;
    }

    if (key.backspace || key.delete) {
      setValue(prev => prev.slice(0, -1));
      setError(null);
      return;
    }

    if (key.upArrow || key.downArrow || key.leftArrow || key.rightArrow || key.ctrl || key.meta) {
      return;
    }

    setValue(prev => prev + input);
    setError(null);
  });

  return (
    <Box width="100%" height="100%" flexDirection="column" alignItems="center" justifyContent="center">
      {showSplash && (
        <Box flexDirection="column" alignItems="center" marginBottom={1}>
          {SPLASH_ART.map((line, i) => (
            <Text key={i} dimColor color="green">{line}</Text>
          ))}
        </Box>
      )}

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
    </Box>
  );
};
