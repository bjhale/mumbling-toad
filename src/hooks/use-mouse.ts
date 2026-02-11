import { useEffect } from 'react';
import { parseMouseEvent, isMouseSequence, type MouseEvent } from '../mouse-parser.js';

interface UseMouseOptions {
	isActive?: boolean;
	onMouseEvent: (event: MouseEvent) => void;
}

export function useMouse({ isActive = true, onMouseEvent }: UseMouseOptions): void {
	useEffect(() => {
		if (!isActive) {
			return;
		}

		const handleData = (data: Buffer) => {
			if (isMouseSequence(data)) {
				const event = parseMouseEvent(data);
				if (event) {
					onMouseEvent(event);
				}
			}
		};

		process.stdin.on('data', handleData);

		return () => {
			process.stdin.removeListener('data', handleData);
		};
	}, [isActive, onMouseEvent]);
}
