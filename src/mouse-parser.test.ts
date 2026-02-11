import { describe, it, expect } from 'vitest';
import { parseMouseEvent, isMouseSequence, type MouseEvent } from './mouse-parser.js';

describe('mouse-parser', () => {
	describe('isMouseSequence', () => {
		it('should detect valid SGR mouse sequence', () => {
			const data = Buffer.from('\x1b[<0;10;5M');
			expect(isMouseSequence(data)).toBe(true);
		});

		it('should reject non-mouse escape sequences', () => {
			const data = Buffer.from('\x1b[A');
			expect(isMouseSequence(data)).toBe(false);
		});

		it('should reject plain text', () => {
			const data = Buffer.from('hello');
			expect(isMouseSequence(data)).toBe(false);
		});

		it('should reject incomplete sequences', () => {
			const data = Buffer.from('\x1b[');
			expect(isMouseSequence(data)).toBe(false);
		});
	});

	describe('parseMouseEvent', () => {
		it('should parse left button press', () => {
			const data = Buffer.from('\x1b[<0;10;5M');
			const event = parseMouseEvent(data);

			expect(event).toEqual<MouseEvent>({
				button: 0,
				x: 10,
				y: 5,
				type: 'press',
				modifiers: { shift: false, alt: false, ctrl: false },
			});
		});

		it('should parse left button release', () => {
			const data = Buffer.from('\x1b[<0;10;5m');
			const event = parseMouseEvent(data);

			expect(event).toEqual<MouseEvent>({
				button: 0,
				x: 10,
				y: 5,
				type: 'release',
				modifiers: { shift: false, alt: false, ctrl: false },
			});
		});

		it('should parse middle button press', () => {
			const data = Buffer.from('\x1b[<1;20;10M');
			const event = parseMouseEvent(data);

			expect(event).toEqual<MouseEvent>({
				button: 1,
				x: 20,
				y: 10,
				type: 'press',
				modifiers: { shift: false, alt: false, ctrl: false },
			});
		});

		it('should parse right button press', () => {
			const data = Buffer.from('\x1b[<2;30;15M');
			const event = parseMouseEvent(data);

			expect(event).toEqual<MouseEvent>({
				button: 2,
				x: 30,
				y: 15,
				type: 'press',
				modifiers: { shift: false, alt: false, ctrl: false },
			});
		});

		it('should parse wheel up event', () => {
			const data = Buffer.from('\x1b[<64;40;20M');
			const event = parseMouseEvent(data);

			expect(event).toEqual<MouseEvent>({
				button: 64,
				x: 40,
				y: 20,
				type: 'wheel',
				modifiers: { shift: false, alt: false, ctrl: false },
			});
		});

		it('should parse wheel down event', () => {
			const data = Buffer.from('\x1b[<65;40;20M');
			const event = parseMouseEvent(data);

			expect(event).toEqual<MouseEvent>({
				button: 65,
				x: 40,
				y: 20,
				type: 'wheel',
				modifiers: { shift: false, alt: false, ctrl: false },
			});
		});

		it('should parse shift modifier', () => {
			const data = Buffer.from('\x1b[<4;10;5M');
			const event = parseMouseEvent(data);

			expect(event).toEqual<MouseEvent>({
				button: 0,
				x: 10,
				y: 5,
				type: 'press',
				modifiers: { shift: true, alt: false, ctrl: false },
			});
		});

		it('should parse alt modifier', () => {
			const data = Buffer.from('\x1b[<8;10;5M');
			const event = parseMouseEvent(data);

			expect(event).toEqual<MouseEvent>({
				button: 0,
				x: 10,
				y: 5,
				type: 'press',
				modifiers: { shift: false, alt: true, ctrl: false },
			});
		});

		it('should parse ctrl modifier', () => {
			const data = Buffer.from('\x1b[<16;10;5M');
			const event = parseMouseEvent(data);

			expect(event).toEqual<MouseEvent>({
				button: 0,
				x: 10,
				y: 5,
				type: 'press',
				modifiers: { shift: false, alt: false, ctrl: true },
			});
		});

		it('should parse multiple modifiers (shift+ctrl)', () => {
			const data = Buffer.from('\x1b[<20;10;5M');
			const event = parseMouseEvent(data);

			expect(event).toEqual<MouseEvent>({
				button: 0,
				x: 10,
				y: 5,
				type: 'press',
				modifiers: { shift: true, alt: false, ctrl: true },
			});
		});

		it('should return null for invalid format', () => {
			const data = Buffer.from('invalid');
			const event = parseMouseEvent(data);

			expect(event).toBeNull();
		});

		it('should return null for non-mouse escape sequence', () => {
			const data = Buffer.from('\x1b[A');
			const event = parseMouseEvent(data);

			expect(event).toBeNull();
		});

		it('should handle wheel event with modifiers', () => {
			const data = Buffer.from('\x1b[<68;50;25M');
			const event = parseMouseEvent(data);

			expect(event).toEqual<MouseEvent>({
				button: 68,
				x: 50,
				y: 25,
				type: 'wheel',
				modifiers: { shift: true, alt: false, ctrl: false },
			});
		});
	});
});
