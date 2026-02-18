import React from 'react';
import { Box, Text, useInput } from 'ink';
import { PageData } from '../crawler/types.js';

interface PageDetailProps {
  page: PageData;
  onClose: () => void;
  isActive: boolean;
}

interface DetailField {
  label: string;
  value: string;
  color?: string;
}

function buildFields(page: PageData): DetailField[] {
  const statusColor = page.statusCode >= 200 && page.statusCode < 300
    ? 'green'
    : page.statusCode >= 300 && page.statusCode < 400
      ? 'yellow'
      : 'red';

  return [
    { label: 'URL', value: page.url },
    { label: 'Final URL', value: page.finalUrl },
    { label: 'Status', value: String(page.statusCode), color: statusColor },
    { label: 'Title', value: page.title || '(empty)' },
    { label: 'H1', value: page.h1 || '(empty)' },
    { label: 'Meta Description', value: page.metaDescription || '(empty)' },
    { label: 'Canonical', value: page.canonical || '(none)' },
    { label: 'Indexable', value: page.isIndexable ? 'Yes' : 'No', color: page.isIndexable ? 'green' : 'red' },
    ...(page.indexabilityReason ? [{ label: 'Reason', value: page.indexabilityReason, color: 'yellow' as const }] : []),
    { label: 'Word Count', value: String(page.wordCount) },
    { label: 'Response Time', value: `${page.responseTimeMs}ms` },
    { label: 'Content Type', value: page.contentType },
  ];
}

const LABEL_WIDTH = 20;

export const PageDetail: React.FC<PageDetailProps> = ({ page, onClose, isActive }) => {
  useInput((_input, key) => {
    if (!isActive) return;
    if (key.escape || key.return) {
      onClose();
    }
  }, { isActive });

  const fields = buildFields(page);

  return (
    <Box
      width="100%"
      height="100%"
      borderStyle="single"
      borderColor="cyan"
      flexDirection="column"
      paddingX={2}
      paddingY={1}
    >
      <Box marginBottom={1} justifyContent="center">
        <Text bold color="cyan">Page Details</Text>
      </Box>

      <Box flexDirection="column">
        {fields.map((field) => (
          <Box key={field.label} flexDirection="row">
            <Box width={LABEL_WIDTH}>
              <Text bold>{field.label}:</Text>
            </Box>
            <Box flexShrink={1}>
              <Text color={field.color} wrap="truncate">{field.value}</Text>
            </Box>
          </Box>
        ))}
      </Box>

      <Box marginTop={2} borderStyle="single" borderColor="gray" paddingX={1}>
        <Text color="gray">
          Escape/Enter: Close
        </Text>
      </Box>
    </Box>
  );
};
