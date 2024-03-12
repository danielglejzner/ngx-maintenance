#!/usr/bin/env node

import { createCommand } from '@commander-js/extra-typings';
import { version } from '../package.json';
import { checkoutImportAndMigrateAngular, getPackageInfo } from '@ngx-maintenance/devkit'
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
		.action((str: string) => {
			const packageNameWithoutScope = str.replace(/^@[^\/]+\//, '');
			const newPackageName = `@ngx-maintenance/${packageNameWithoutScope}`;
			const message = `
				${cliStyling.yellow}${cliStyling.bold}WARNING ${newPackageName} (formely ${str}):${cliStyling.reset} This package is part of the ${cliStyling.underline}Angular Compatibility Maintenance Initiative${cliStyling.reset}.
				It receives updates for Angular compatibility only, with no new features or bug fixes.
				Please plan to migrate to an actively supported alternative.
				`;
			console.log(message)
		})

	program
		.command('migrate-npm')
		.description('Checkout a Git repo and migrate Angular versions')
		.argument('npm package', 'NPM package name')
		.argument('[targetLocation]', 'Directory to clone the repository into', '')
		.action(async (npmPackage, targetLocation?: string) => {
			try {

				const packageJson = await getPackageInfo(npmPackage, 'latest')
				const repoUrl = typeof packageJson.repository === 'string' ? packageJson.repository : packageJson?.repository?.url;
				if (!repoUrl) throw new Error('Cound not locate Github URL from package. Please locate and use migrate-git instead')
				await checkoutImportAndMigrateAngular(repoUrl, targetLocation);
				console.log('Migration completed successfully.');
			} catch (error: any) {
				console.error(`Migration failed: ${error.message}`);
			}
		});

	program
		.command('migrate-git')
		.description('Checkout a Git repo and migrate Angular versions')
		.argument('<repoUrl>', 'URL of the Git repository to clone')
		.argument('<targetLocation>', 'Directory to clone the repository into', '')
		.argument('[packageName]', 'Name of the package to find and migrate', '')
		.action(async (repoUrl, targetLocation, packageName) => {
			try {
				await checkoutImportAndMigrateAngular(repoUrl, targetLocation, packageName);
				console.log('Migration completed successfully.');
			} catch (error: any) {
				console.error(`Migration failed: ${error.message}`);
			}
		});


	program.parse();

}

main();
