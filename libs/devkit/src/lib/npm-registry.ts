import {get} from 'https';
import { satisfies } from 'semver';

interface PackageJson {
	readonly [field: string]: any;
	readonly name: string,
	readonly description?: string;
	readonly versions: string,
	readonly dependencies?: Record<string, string>,
	readonly devDependencies?: Record<string, string>,
	readonly peerDependencies?: Record<string, string>
	readonly repository?: string | {
		directory?: string;
		type: string;
		url: string;
	}
}

interface PackageInfo {
	versions: Record<string, PackageJson>;
}


export function getPackageInfo(packageName: string, version: string): Promise<PackageJson>;
export function getPackageInfo(packageName: string, version?: undefined): Promise<PackageInfo>;
export async function getPackageInfo(packageName: string, version?: string): Promise<PackageInfo | PackageJson> {
	const registryUrl = `https://registry.npmjs.org/${encodeURIComponent(packageName)}${version ? `/${version}` : ''}`;
	return new Promise((resolve, reject) => {
		get(registryUrl, (response) => {
			let data = '';
			response.on('data', (chunk: string) => {
				data += chunk;
			});
			response.on('end', () => {
				try {
					if (version) {
						const packageJson: PackageJson = JSON.parse(data);
						resolve(packageJson);
					} else {
						const packageInfo: PackageInfo = JSON.parse(data);
						resolve(packageInfo);
					}
				} catch (error) {
					reject(error);
				}
			});
		}).on('error', (error) => {
			reject(error);
		});
	});
}
export async function findCompatibleVersion(packageName: string, versionRange: string, peerDependency: string): Promise<string | null> {
	try {
		const packageInfo = await getPackageInfo(packageName);
		const versions = Object.keys(packageInfo.versions);
		const compatibleVersion = versions.find(version => {
			const versionPackageJson = packageInfo.versions[version];
			const packages = { ...(versionPackageJson.dependencies || {}), ...(versionPackageJson.devDependencies || {}), ...(versionPackageJson.peerDependencies || {}) };
			return satisfies(packages[peerDependency], versionRange);
		});

		return compatibleVersion || null;
	} catch (error) {
		throw error;
	}
}
