export interface ScrollbarParams {
  totalRows: number;
  visibleRows: number;
  scrollOffset: number;
  trackHeight: number;
}

export interface ScrollbarResult {
  thumbStart: number;  // 0-based index in track
  thumbEnd: number;    // exclusive
  trackHeight: number;
}

export function computeScrollbar(params: ScrollbarParams): ScrollbarResult {
  const { totalRows, visibleRows, scrollOffset, trackHeight } = params;
  
  // If all rows fit, thumb fills entire track
  if (totalRows <= visibleRows) {
    return { thumbStart: 0, thumbEnd: trackHeight, trackHeight };
  }
  
  // Thumb size proportional to visible/total
  const thumbSize = Math.max(1, Math.round((visibleRows / totalRows) * trackHeight));
  
  // Thumb position based on scroll progress
  const maxScroll = Math.max(1, totalRows - visibleRows);
  const scrollProgress = scrollOffset / maxScroll;
  const maxThumbPos = trackHeight - thumbSize;
  const thumbStart = Math.round(scrollProgress * maxThumbPos);
  const thumbEnd = thumbStart + thumbSize;
  
  return { thumbStart, thumbEnd, trackHeight };
}
