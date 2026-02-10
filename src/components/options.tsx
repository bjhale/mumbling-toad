import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { CrawlOptions } from '../crawler/types.js';

interface OptionsProps {
  options: CrawlOptions;
  onClose: (updatedOptions: CrawlOptions) => void;
  isActive: boolean;
}

type FieldType = 'number' | 'boolean' | 'text' | 'disabled';

interface FieldConfig {
  key: keyof CrawlOptions;
  label: string;
  type: FieldType;
  suffix?: string;
}

const FIELDS: FieldConfig[] = [
  { key: 'maxConcurrency', label: 'Concurrency Limit', type: 'number' },
  { key: 'requestDelayMs', label: 'Request Delay (ms)', type: 'number' },
  { key: 'maxPages', label: 'Max Pages', type: 'number' },
  { key: 'maxDepth', label: 'Crawl Depth', type: 'number' },
  { key: 'respectRobotsTxt', label: 'Respect robots.txt', type: 'boolean' },
  { key: 'renderJs', label: 'JS Rendering', type: 'disabled', suffix: ' (coming soon)' },
  { key: 'userAgent', label: 'User-Agent', type: 'text' },
];

export const Options: React.FC<OptionsProps> = ({ options, onClose, isActive }) => {
  const [currentOptions, setCurrentOptions] = useState<CrawlOptions>({ ...options });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editBuffer, setEditBuffer] = useState('');

  useInput((input, key) => {
    if (!isActive) return;

    if (isEditing) {
      if (key.escape || key.return) {
        if (key.return) {
          const field = FIELDS[selectedIndex];
          if (field) {
            let newValue: any = editBuffer;

            if (field.type === 'number') {
              const num = parseInt(editBuffer, 10);
              newValue = isNaN(num) ? 0 : num;
            }
            
            setCurrentOptions(prev => ({
              ...prev,
              [field.key]: newValue
            }));
          }
        }
        
        setIsEditing(false);
        setEditBuffer('');
        return;
      }

      if (key.backspace || key.delete) {
        setEditBuffer(prev => prev.slice(0, -1));
        return;
      }

      if (input.length === 1) {
          setEditBuffer(prev => prev + input);
      }
      return;
    }

    if (key.escape) {
      onClose(currentOptions);
    } else if (key.upArrow) {
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : FIELDS.length - 1));
    } else if (key.downArrow) {
      setSelectedIndex(prev => (prev < FIELDS.length - 1 ? prev + 1 : 0));
    } else if (key.return) {
      const field = FIELDS[selectedIndex];
      
      if (field) {
        if (field.type === 'disabled') return;

        if (field.type === 'boolean') {
          setCurrentOptions(prev => ({
            ...prev,
            [field.key]: !prev[field.key]
          }));
        } else {
          setIsEditing(true);
          setEditBuffer(String(currentOptions[field.key]));
        }
      }
    }
  }, { isActive });

  return (
    <Box 
      width="100%" 
      height="100%" 
      borderStyle="single" 
      borderColor="green" 
      flexDirection="column"
      paddingX={2}
      paddingY={1}
    >
      <Box marginBottom={1} justifyContent="center">
        <Text bold color="green">Crawl Options</Text>
      </Box>

      <Box flexDirection="column" gap={1}>
        {FIELDS.map((field, index) => {
          const isSelected = index === selectedIndex;
          const isFieldEditing = isSelected && isEditing;
          const value = currentOptions[field.key];
          
          let displayValue = String(value);
          if (field.type === 'boolean') {
            displayValue = value ? 'Yes' : 'No';
          }
          if (field.type === 'disabled') {
              displayValue = 'No' + (field.suffix || '');
          }

          return (
            <Box key={field.key} flexDirection="row">
              <Box width={2} justifyContent="flex-end" marginRight={1}>
                {isSelected && <Text color="cyan">{'>'}</Text>}
              </Box>
              
              <Box width={25}>
                <Text color={isSelected ? 'cyan' : undefined} bold={isSelected}>
                  {field.label}:
                </Text>
              </Box>

              <Box>
                {isFieldEditing ? (
                  <Text backgroundColor="blue" color="white">
                    {editBuffer}_
                  </Text>
                ) : (
                  <Text color={field.type === 'disabled' ? 'gray' : 'white'}>
                    {displayValue}
                  </Text>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>

      <Box marginTop={2} borderStyle="single" borderColor="gray" paddingX={1}>
        <Text color="gray">
          Up/Down: Navigate • Enter: Edit/Toggle • Escape: Close & Save
        </Text>
      </Box>
    </Box>
  );
};
