import https from 'https';

interface PackageInfo {
	versions: Record<string, any>;
}

export async function findCompatibleVersion(packageName: string, versionRange: string): Promise<string | null> {
	const registryUrl = `https://registry.npmjs.org/${encodeURIComponent(packageName)}`;
	return new Promise<string | null>((resolve, reject) => {
		https.get(registryUrl, (response) => {
			let data = '';
			response.on('data', (chunk: string) => {
				data += chunk;
			});
			response.on('end', () => {
				try {
					const packageInfo: PackageInfo = JSON.parse(data);
					const versions = Object.keys(packageInfo.versions);
					let compatibleVersion: string | null = null;

					// Check each version against the version range
					for (const version of versions) {
						if (satisfiesVersion(version, versionRange)) {
							compatibleVersion = version;
							break;
						}
					}

					resolve(compatibleVersion);
				} catch (error) {
					reject(error);
				}
			});
		}).on('error', (error) => {
			reject(error);
		});
	});
}

// Function to check if a version satisfies a version range
function satisfiesVersion(version: string, versionRange: string): boolean {
	const requiredVersion = parseVersion(versionRange);
	const actualVersion = parseVersion(version);
	return compareVersions(actualVersion, requiredVersion) <= 0;
}

// Function to parse version string into an array of numbers
function parseVersion(versionString: string): number[] {
	return versionString.split('.').map(Number);
}

// Function to compare two version arrays
function compareVersions(version1: number[], version2: number[]): number {
	for (let i = 0; i < Math.max(version1.length, version2.length); i++) {
		const a = version1[i] || 0;
		const b = version2[i] || 0;
		if (a !== b) {
			return a - b;
		}
	}
	return 0;
}
