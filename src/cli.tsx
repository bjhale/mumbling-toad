#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import meow from 'meow';
import { App } from './app.js';
import { parseDebugLevel, type DebugLevel } from './debug-logger.js';

const cli = meow(`
	Usage
	  $ mumbling-toad [domain]

	Options
	  --debug, -d [level]  Enable debug logging to ./mumbling-toad-debug.log
	                       Levels: debug, info, warning (default), error
	  --help               Show help

	Examples
	  $ mumbling-toad
	  $ mumbling-toad https://example.com
`, {
	flags: {
		debug: {
			type: 'string',
			shortFlag: 'd',
		}
	},
	importMeta: import.meta,
});

let resolvedDebugLevel: DebugLevel | undefined;

if (cli.flags.debug !== undefined) {
	// Flag was provided (either bare or with value)
	const debugInput = cli.flags.debug === '' ? 'warning' : cli.flags.debug;
	const parsed = parseDebugLevel(debugInput);
	
	if (parsed === null) {
		console.error(`Invalid debug level: "${debugInput}". Valid levels: debug, info, warning, error`);
		process.exit(1);
	}
	
	resolvedDebugLevel = parsed;
}

process.stdout.write('\x1B[2J\x1B[3J\x1B[H');
const app = render(<App initialUrl={cli.input[0]} debugLevel={resolvedDebugLevel} />);

app.waitUntilExit().then(() => {
	process.stdout.write('\x1b[?1003l\x1b[?1006l');
	process.stdout.write('\x1B[2J\x1B[3J\x1B[H');
});

process.on('exit', () => {
	try {
		process.stdout.write('\x1b[?1003l\x1b[?1006l');
	} catch (e) {
	}
});
