import { useEffect } from 'react';
import { useStdin } from 'ink';
import { parseMouseEvent, isMouseSequence, type MouseEvent } from '../mouse-parser.js';

interface UseMouseOptions {
	isActive?: boolean;
	onMouseEvent: (event: MouseEvent) => void;
}

export function useMouse({ isActive = true, onMouseEvent }: UseMouseOptions): void {
	// Access Ink's internal event emitter — Ink v6 reads stdin via `readable`
	// events and re-emits chunks as 'input' on this emitter. Listening on
	// process.stdin directly never fires because Ink already consumes the data.
	const { internal_eventEmitter } = useStdin() as ReturnType<typeof useStdin> & {
		internal_eventEmitter: import('node:events').EventEmitter;
	};

	useEffect(() => {
		if (!isActive || !internal_eventEmitter) {
			return;
		}

		const handleInput = (data: string) => {
			if (isMouseSequence(data)) {
				const event = parseMouseEvent(data);
				if (event) {
					onMouseEvent(event);
				}
			}
		};

		internal_eventEmitter.on('input', handleInput);

		return () => {
			internal_eventEmitter.removeListener('input', handleInput);
		};
	}, [isActive, onMouseEvent, internal_eventEmitter]);
}
