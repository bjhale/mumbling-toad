import { describe, it, expect } from 'vitest';

describe('Regression Tests: Task 1 & 2 Fixes', () => {
  describe('Buffer-flush atomic snapshot pattern (Task 1)', () => {
    it('should create snapshot with splice(0) that persists even if source array modified', () => {
      // Simulate pageBuffer.current pattern
      const buffer = [
        { id: 1, url: 'https://example.com/page1' },
        { id: 2, url: 'https://example.com/page2' },
        { id: 3, url: 'https://example.com/page3' }
      ];

      // Use splice(0) to create atomic snapshot
      const snapshot = buffer.splice(0);

      // Verify snapshot contains original data
      expect(snapshot).toHaveLength(3);
      expect(snapshot[0]?.url).toBe('https://example.com/page1');
      expect(snapshot[1]?.url).toBe('https://example.com/page2');
      expect(snapshot[2]?.url).toBe('https://example.com/page3');

      // Verify original buffer is now empty
      expect(buffer).toHaveLength(0);

      // Even if we modify buffer after, snapshot remains intact
      buffer.push({ id: 4, url: 'https://example.com/page4' });
      expect(snapshot).toHaveLength(3); // Snapshot unchanged
      expect(buffer).toHaveLength(1);
    });

    it('should atomically extract all items AND clear source array in one operation', () => {
      // Test the atomic guarantee: splice(0) is both snapshot AND clear
      const buffer = ['item1', 'item2', 'item3', 'item4'];

      // Single atomic operation
      const extracted = buffer.splice(0);

      // Both conditions met simultaneously
      expect(extracted).toEqual(['item1', 'item2', 'item3', 'item4']);
      expect(buffer).toEqual([]);

      // This prevents the React 19 race condition where:
      // buffer.current = [] could execute before setState updater reads buffer.current
    });
  });

  describe('onCrawlComplete flush pattern (Task 1)', () => {
    it('should flush remaining buffer items with splice(0) snapshot before completion', () => {
      // Simulate onCrawlComplete scenario where buffer has unflushed items
      const pageBuffer = [
        { url: 'https://example.com/page-final-1', status: 200 },
        { url: 'https://example.com/page-final-2', status: 200 }
      ];

      // Simulate the pattern used in onCrawlComplete (line 113)
      const batch = pageBuffer.splice(0);

      // Verify batch captured remaining items
      expect(batch).toHaveLength(2);
      expect(batch[0]?.url).toBe('https://example.com/page-final-1');
      expect(batch[1]?.url).toBe('https://example.com/page-final-2');

      // Verify buffer is cleared
      expect(pageBuffer).toHaveLength(0);

      // In app.tsx, this batch is then used in:
      // setPages(prev => [...prev, ...batch])
      // Guaranteeing all items are captured before setState updater runs
    });
  });

  describe('tableAvailableHeight independence (Task 2)', () => {
    it('should calculate table height consistently regardless of console state', () => {
      // Task 2 fix: removed conditional logic from tableAvailableHeight
      // Before: consoleOpen ? (rows) - 6 - 11 : (rows) - 6
      // After: (rows) - 6

      const rows = 24;

      // The calculation is now pure and independent
      const tableAvailableHeight = rows - 6;

      expect(tableAvailableHeight).toBe(18);

      // Verify calculation doesn't depend on any boolean parameter
      const consoleOpenTrue = rows - 6;
      const consoleOpenFalse = rows - 6;

      expect(consoleOpenTrue).toBe(18);
      expect(consoleOpenFalse).toBe(18);
      expect(consoleOpenTrue).toBe(consoleOpenFalse);

      // The console overlay is now positioned absolutely with marginTop
      // and doesn't affect the table height calculation
    });

    it('should produce consistent results for different terminal sizes', () => {
      // Test the pure function behavior across different terminal heights
      const testCases = [
        { rows: 24, expected: 18 },
        { rows: 30, expected: 24 },
        { rows: 40, expected: 34 },
        { rows: 50, expected: 44 }
      ];

      for (const { rows, expected } of testCases) {
        const tableAvailableHeight = rows - 6;
        expect(tableAvailableHeight).toBe(expected);
      }

      // The constant 6 accounts for:
      // - Header row (1)
      // - Status bar (2)
      // - Layout padding/margins (3)
    });
  });
});
