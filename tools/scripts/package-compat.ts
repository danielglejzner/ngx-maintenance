import https from 'https';
import semver from 'semver';

interface PackageInfo {
	versions: Record<string, any>;
}

export async function findCompatibleVersion(packageName: string, versionRange: string, peerDependency: string): Promise<string | null> {
	const registryUrl =`https://registry.npmjs.org/${encodeURIComponent(packageName)}`;
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
					const compatibleVersion = versions.find(version => {
						const versionPackageJson: Record<string, any> = packageInfo.versions[version];
						const packages = { ...(versionPackageJson.dependencies || {}), ...(versionPackageJson.devDependencies || {}), ...(versionPackageJson.peerDependencies || {}) };
						return semver.satisfies(packages[peerDependency], versionRange);
					});

					resolve(compatibleVersion || null);
				} catch (error) {
					reject(error);
				}
			});
		}).on('error', (error) => {
			reject(error);
		});
	});
}