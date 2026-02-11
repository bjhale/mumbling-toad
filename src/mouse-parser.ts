/**
 * SGR Mouse Protocol Parser
 * 
 * Parses ANSI SGR mouse sequences (\x1b[<btn;x;y;M/m format)
 * Used for terminal mouse event handling
 */

export interface MouseEvent {
	button: number; // 0=left, 1=middle, 2=right, 64=wheelUp, 65=wheelDown
	x: number; // 1-based column
	y: number; // 1-based row
	type: 'press' | 'release' | 'wheel';
	modifiers: {
		shift: boolean;
		alt: boolean;
		ctrl: boolean;
	};
}

/**
 * Check if a buffer contains an SGR mouse sequence
 * SGR sequences start with \x1b[< (ESC [ <)
 */
export function isMouseSequence(data: Buffer): boolean {
	return (
		data.length >= 3 &&
		data[0] === 0x1b && // ESC
		data[1] === 0x5b && // [
		data[2] === 0x3c // <
	);
}

/**
 * Parse an SGR mouse sequence into a MouseEvent
 * Format: \x1b[<btn;x;y;M (press) or \x1b[<btn;x;y;m (release)
 * 
 * Button encoding:
 * - Bits 0-1: button (0=left, 1=middle, 2=right)
 * - Bit 2 (4): shift modifier
 * - Bit 3 (8): alt modifier
 * - Bit 4 (16): ctrl modifier
 * - Bit 6 (64): wheel event (64=up, 65=down)
 */
export function parseMouseEvent(data: Buffer): MouseEvent | null {
	const str = data.toString();
	const regex = /\x1b\[<(\d+);(\d+);(\d+)([Mm])/;
	const match = str.match(regex);

	if (!match || !match[1] || !match[2] || !match[3] || !match[4]) {
		return null;
	}

	const button = parseInt(match[1], 10);
	const x = parseInt(match[2], 10);
	const y = parseInt(match[3], 10);
	const eventType = match[4] === 'M' ? 'press' : 'release';

	// Decode modifiers from button bits
	const modifiers = {
		shift: (button & 4) !== 0,
		alt: (button & 8) !== 0,
		ctrl: (button & 16) !== 0,
	};

	// Check if wheel event (bit 6 set)
	if (button & 64) {
		return {
			button,
			x,
			y,
			type: 'wheel',
			modifiers,
		};
	}

	// Regular button event (mask out modifier bits to get base button)
	const baseButton = button & 3;

	return {
		button: baseButton,
		x,
		y,
		type: eventType,
		modifiers,
	};
}
