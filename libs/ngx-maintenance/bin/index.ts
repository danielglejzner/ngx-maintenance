#!/usr/bin/env node

import { createCommand } from '@commander-js/extra-typings';
import { version } from '../package.json';

const cliStyling = {
	reset: '\x1b[0m',
	yellow: '\x1b[33m',
	underline: '\x1b[4m',
	bold: '\x1b[1m',
}

async function main() {
	const program = createCommand();
	program.version(version);

	program
		.command('warn')
		.description('used for postinstall script to leave a message')
		.argument('<string>', 'name of the original package')
		.action(str => {
			const message = `
				${cliStyling.yellow}${cliStyling.bold}WARNING @ngx-maintenance/${str}(formely ${str}):${cliStyling.reset} This package is part of the ${cliStyling.underline}Angular Compatibility Maintenance Initiative${cliStyling.reset}.
				It receives updates for Angular compatibility only, with no new features or bug fixes.
				Please plan to migrate to an actively supported alternative.
				`;
			console.log(message)
		})

	program.parse();

}

main();
