#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import meow from 'meow';
import { App } from './app.js';

const cli = meow(`
	Usage
	  $ mumbling-toad [domain]

	Options
	  --help     Show help

	Examples
	  $ mumbling-toad
	  $ mumbling-toad https://example.com
`, {
	importMeta: import.meta,
});

process.stdout.write('\x1B[2J\x1B[3J\x1B[H');
const app = render(<App initialUrl={cli.input[0]} />);

process.stdout.write('\x1b[?1000h\x1b[?1006h');

app.waitUntilExit().then(() => {
	process.stdout.write('\x1b[?1000l\x1b[?1006l');
	process.stdout.write('\x1B[2J\x1B[3J\x1B[H');
});

process.on('exit', () => {
	try {
		process.stdout.write('\x1b[?1000l\x1b[?1006l');
	} catch (e) {
	}
});
