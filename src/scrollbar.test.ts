import { describe, it, expect } from 'vitest';
import { computeScrollbar } from './scrollbar.js';

describe('computeScrollbar', () => {
  it('should fill entire track when total rows is 0', () => {
    const result = computeScrollbar({
      totalRows: 0,
      visibleRows: 10,
      scrollOffset: 0,
      trackHeight: 10
    });
    expect(result).toEqual({
      thumbStart: 0,
      thumbEnd: 10,
      trackHeight: 10
    });
  });

  it('should fill entire track when total equals visible', () => {
    const result = computeScrollbar({
      totalRows: 20,
      visibleRows: 20,
      scrollOffset: 0,
      trackHeight: 20
    });
    expect(result).toEqual({
      thumbStart: 0,
      thumbEnd: 20,
      trackHeight: 20
    });
  });

  it('should position thumb at top when scrolled to start', () => {
    const result = computeScrollbar({
      totalRows: 100,
      visibleRows: 20,
      scrollOffset: 0,
      trackHeight: 20
    });
    expect(result.thumbStart).toBe(0);
    expect(result.thumbEnd).toBeGreaterThan(0);
    expect(result.thumbEnd - result.thumbStart).toBeGreaterThanOrEqual(1);
  });

  it('should position thumb at bottom when scrolled to end', () => {
    const result = computeScrollbar({
      totalRows: 100,
      visibleRows: 20,
      scrollOffset: 80,
      trackHeight: 20
    });
    expect(result.thumbEnd).toBe(20);
    expect(result.thumbStart).toBeLessThan(20);
    expect(result.thumbEnd - result.thumbStart).toBeGreaterThanOrEqual(1);
  });

  it('should enforce minimum thumb size of 1', () => {
    const result = computeScrollbar({
      totalRows: 100,
      visibleRows: 1,
      scrollOffset: 0,
      trackHeight: 10
    });
    expect(result.thumbEnd - result.thumbStart).toBeGreaterThanOrEqual(1);
  });

  it('should calculate thumb size proportional to visible/total ratio', () => {
    const result = computeScrollbar({
      totalRows: 100,
      visibleRows: 20,
      scrollOffset: 0,
      trackHeight: 20
    });
    const expectedThumbSize = Math.round((20 / 100) * 20);
    expect(result.thumbEnd - result.thumbStart).toBe(expectedThumbSize);
  });

  it('should position thumb in middle for midpoint scroll', () => {
    const result = computeScrollbar({
      totalRows: 100,
      visibleRows: 20,
      scrollOffset: 40,
      trackHeight: 20
    });
    expect(result.thumbStart).toBeGreaterThan(0);
    expect(result.thumbEnd).toBeLessThan(20);
    expect(result.thumbStart).toBeGreaterThanOrEqual(7);
    expect(result.thumbStart).toBeLessThanOrEqual(10);
  });
});
