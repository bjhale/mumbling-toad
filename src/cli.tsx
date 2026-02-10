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

render(<App initialUrl={cli.input[0]} />);
