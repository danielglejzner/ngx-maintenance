import { spawn } from 'child_process';
import { promises as fs, existsSync, readdir, stat } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { promisify } from 'util';
import { httpsRequest } from '@ngx-maintenance/utils';
import { findCompatibleVersion, PackageJson } from '@ngx-maintenance/npm-api';

const readdirAsync = promisify(readdir);
const statAsync = promisify(stat);
const { logProgress } = createLogProcess();

const colors = {
	reset: "\x1b[0m",
	red: "\x1b[31m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
};

const logWithColor = (message: string, color: keyof typeof colors) => {
	console.log(`${colors[color]}${message}${colors.reset}`);
};

function createLogProcess() {
	const progress: Map<string, boolean> = new Map();

	const logProgress = (message: string): (() => void) => {
		progress.set(message, false);
		printProgress();
		return (): void => {
			progress.set(message, true);
			printProgress();
		};
	};

	const printProgress = (): void => {
		console.clear();
		progress.forEach((completed, message) => {
			const checkbox = completed ? "[\x1b[32m✔\x1b[0m]" : "[ ]";
			console.log(`${checkbox} ${message}`);
		});
	};

	return { logProgress };
}
const executeCommand = (command: string, workingDirectory: string = '.'): Promise<{ stdout: string, stderr: string }> => {
	return new Promise((resolve, reject) => {
		const [cmd, ...args] = command.split(/\s+/);
		const child = spawn(cmd, args, { cwd: workingDirectory, shell: true, stdio: ['pipe', 'pipe', 'pipe'],  });

		let stdout = '';
		let stderr = '';
		child.stdout.setEncoding('utf8');
		child.stdout.on('data', (data) => {
			process.stdout.write(data);
			stdout += data.toString();
		});

		child.stderr.on('data', (data) => {
			process.stderr.write(data);
			stderr += data.toString();
		});

		child.on('error', (error) => {
			reject(error);
		});

		child.on('close', (code) => {
			if (code === 0) {
				resolve({ stdout, stderr });
			} else {
				reject({ stdout, stderr, message: `Command "${command}" exited with code ${code}` });
			}
		});
	});
};

const getPackageName = (repoUrl: string, providedName?: string): string => {
	return providedName || path.basename(repoUrl, '.git');
};

const updatePackageJsonDependencies = async (packageDir: string, dependencyUpdates: Record<string, string>[]) => {
	const packageJsonPath = path.join(packageDir, 'package.json');
	let packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

	dependencyUpdates.forEach(({ packageName, versionRange }) => {
		if (packageJson.dependencies && packageJson.dependencies[packageName]) {
			packageJson.dependencies[packageName] = versionRange;
		}
		if (packageJson.devDependencies && packageJson.devDependencies[packageName]) {
			packageJson.devDependencies[packageName] = versionRange;
		}
	});

	await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');
	logWithColor("package.json updated with new versions.", "green");
};

const findPackageDir = async (repoPath: string, packageName: string): Promise<string> => {
	const potentialDirs = [packageName, 'src'];

	async function searchDir(currentPath: string): Promise<string | null> {
		const entries = await fs.readdir(currentPath, { withFileTypes: true });

		for (const entry of entries) {
			if (entry.isDirectory() && !entry.name.startsWith('.')) { // Skip hidden directories
				const fullPath = path.join(currentPath, entry.name);
				if (potentialDirs.includes(entry.name)) {
					return fullPath;
				}

				const foundPath = await searchDir(fullPath);
				if (foundPath) return foundPath;
			}
		}

		return null; // No matching directory found in this branch
	}

	const foundDir = await searchDir(repoPath);

	if (!foundDir) {
		throw new Error(`None of the specified directories (${potentialDirs.join(', ')}) were found in the repository.`);
	}

	return foundDir;
};


const cloneRepo = async (repoUrl: string): Promise<string> => {
	const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'angular-update-'));
	await executeCommand(`git clone ${repoUrl} ${tmpDir}`);
	return tmpDir;
};

const copyDir = async (src: string, dest: string): Promise<void> => {
	await fs.mkdir(dest, { recursive: true });
	const entries = await readdirAsync(src);
	for (const entry of entries) {
		const srcPath = path.join(src, entry);
		const destPath = path.join(dest, entry);
		const entryStats = await statAsync(srcPath);
		if (entryStats.isDirectory()) {
			await copyDir(srcPath, destPath);
		} else {
			await fs.copyFile(srcPath, destPath);
		}
	}
};

const removeDir = async (dirPath: string): Promise<void> => {
	const entries = await readdirAsync(dirPath);
	await Promise.all(entries.map(async (entry) => {
		const fullPath = path.join(dirPath, entry);
		const entryStats = await statAsync(fullPath);
		if (entryStats.isDirectory()) {
			await removeDir(fullPath);
		} else {
			await fs.unlink(fullPath);
		}
	}));
	await fs.rmdir(dirPath);
};

const getLatestAngularVersion = () => {
	const options = {
		hostname: 'registry.npmjs.org',
		path: '/@angular/core/latest',
		method: 'GET',
	};
	return httpsRequest<PackageJson>(options)
		.then(data => data.version)

};

const getCurrentAngularVersion = async (packageDir: string) => {
	const packageJsonPath = path.join(packageDir, 'package.json');
	let packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

	// TODO: Change this to find any @angular and grab that if core and cli not in
	return packageJson.dependencies["@angular/core"];
}

const updateAngularVersions = async (packageDir: string) => {
	let retry = true;
	let attempts = 0;
	const maxAttempts = 8;

	while (retry && attempts < maxAttempts) {
		try {
			const latestVersion = await getLatestAngularVersion();
			const latestMajorVersion = parseInt(latestVersion.split('.')[0]);

			const currentVersion = await getCurrentAngularVersion(packageDir);
			const match = currentVersion.match(/\d+/);
			const currentMajorVersion = parseInt(match[0]);

			for (let major = currentMajorVersion; major <= latestMajorVersion; major++) {
				const updateCommand = `npx ng update @angular/cli@^${major}.0.0 @angular/core@^${major}.0.0 --allow-dirty`;
				const markUpdateStart = logProgress(`Updating to Angular version ^${major}.0.0`);
				await executeCommand(updateCommand, packageDir);
				markUpdateStart();
				logWithColor(`Successfully updated to Angular version ^${major}.0.0`, 'green');
			}

			logWithColor("Successfully updated Angular versions to the latest.", 'green');
			retry = false;
		} catch (error: any) {
			const stderr = error.stderr || error.message;
			attempts++;

			if (stderr.includes('The Angular CLI currently requires npm version')) {
				const match = stderr.match(/npm version (\d+\.\d+\.\d+) detected./);
				if (match) {
					const requiredNpmVersion = match[1];
					logWithColor(`Updating global npm to version ${requiredNpmVersion} to meet Angular CLI requirements.`, 'yellow');
					await executeCommand(`npm install --global npm@${requiredNpmVersion}`);
				}
			} else if (stderr.match(/requires a peer of/)) {
				const dependencyUpdates: Record<string, string>[] = [];
				const regex = /requires a peer of ([^ ]+) "([^"]+)"/g;
				let match: RegExpExecArray | null;

				while ((match = regex.exec(stderr)) !== null) {
					const [, packageName, versionRange] = match;
					dependencyUpdates.push({ packageName, versionRange });
					logWithColor(`Found peer dependency issue: ${packageName} ${versionRange}`, 'red');
				}

				if (dependencyUpdates.length > 0) {
					await updatePackageJsonDependencies(packageDir, dependencyUpdates);
					logWithColor('Attempting to fix peer dependencies and retrying.', 'yellow');
					await executeCommand('npm install', packageDir);
				}
			} else if (stderr.includes('Incompatible peer dependencies found')) {
				const dependencyUpdates: Record<string, string>[] = [];
				const regex = /Package "([^"]+)" has an incompatible peer dependency to "([^"]+)" \(([^)]+)\)/g;
				let match: RegExpExecArray | null;

				while ((match = regex.exec(stderr)) !== null) {
					const [, packageName, peerDependency, versionRange] = match;
					logWithColor(`Found incompatible peer dependency issue: ${packageName} ${peerDependency} ${versionRange}`, 'red');


					const regex = /requires "([^"]+)", would install "([^"]+)"/;
					const match2 = versionRange.match(regex);
					const compatibleVersion = match2?.[2] ? await findCompatibleVersion(packageName, match2[2], peerDependency) : null;

					if (compatibleVersion) {
						logWithColor(`Found compatible version: ${packageName} ${peerDependency} ${compatibleVersion}`, 'green');
						dependencyUpdates.push({ packageName, versionRange: compatibleVersion })
					} else if (match2?.[2]) {
						dependencyUpdates.push({ packageName: peerDependency, versionRange: match2?.[2] })
					} else {
						logWithColor(`Unable to find compatible version. Trying to force the install`, 'red');
						try {
							await executeCommand('npm install -f', packageDir);
						} catch (error: any) {

							throw new Error('Unable to extract correct version range');
						}
					}
				}

				if (dependencyUpdates.length > 0) {
					await updatePackageJsonDependencies(packageDir, dependencyUpdates);
					logWithColor('Attempting to fix incompatible peer dependencies and retrying.', 'yellow');
					await executeCommand('npm install -f', packageDir);
				}
			} else {
				retry = false;
				logWithColor(`Update failed after ${attempts} attempts. Error: ${stderr}`, 'red');
				throw new Error(`Update failed with an unhandled error: ${stderr}`);
			}
		}
	}

	if (attempts >= maxAttempts) {
		logWithColor(`Update failed after reaching maximum attempts (${maxAttempts}).`, 'red');
		throw new Error(`Update failed after reaching maximum attempts (${maxAttempts}).`);
	}
};

export const checkoutImportAndMigrateAngular = async (repoUrl: string, targetLocation?: string, packageName?: string) => {
	let clonedRepoPath = '';

	try {
		const markCloneComplete = logProgress("Cloning repository");
		logWithColor("Starting the Angular package update process...", "yellow");
		clonedRepoPath = await cloneRepo(repoUrl);
		markCloneComplete();

		const markInstallComplete = logProgress("Installing NPM packages");
		await executeCommand('npm install', clonedRepoPath);
		markInstallComplete();

		const markUpdateComplete = logProgress("Updating Angular versions");
		await updateAngularVersions(clonedRepoPath);
		markUpdateComplete();

		const markFindPackageDirComplete = logProgress("Locating package directory");
		const defaultPackageName = getPackageName(repoUrl, packageName);
		const packageDir = await findPackageDir(clonedRepoPath, defaultPackageName);
		markFindPackageDirComplete();
		const resolvedTargetLocation = path.resolve(process.cwd(), targetLocation || `./angular-pkgs/${defaultPackageName}`);
		if (!existsSync(resolvedTargetLocation)) {
			await fs.mkdir(resolvedTargetLocation, { recursive: true });
		}

		const markCopyDirComplete = logProgress("Copying updated package to target location");
		await copyDir(packageDir, resolvedTargetLocation);
		markCopyDirComplete();

		logWithColor("Angular package update process completed successfully.", "green");
	} catch (error) {
		logWithColor(`An error occurred: ${error}`, "red");
	} finally {
		if (clonedRepoPath) {
			const markCleanupComplete = logProgress("Cleaning up temporary files");
			await removeDir(clonedRepoPath);
			markCleanupComplete();
		}
	}
};
