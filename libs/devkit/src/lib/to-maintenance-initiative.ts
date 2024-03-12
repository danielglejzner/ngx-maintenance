import { Tree, updateJson, addDependenciesToPackageJson, formatFiles, visitNotIgnoredFiles } from '@nx/devkit';

export function toMaintenanceInitiative(tree: Tree, oldPackageName: string, newVersion = "1.0.0") {
	// Strip existing scope if present
	const packageNameWithoutScope = oldPackageName.replace(/^@[^\/]+\//, '');
	const newPackageName = `@ngx-maintenance/${packageNameWithoutScope}`;

	updateJson(tree, 'package.json', (json) => {
		for (const deps of [json.dependencies, json.devDependencies]) {
			if (deps && deps[oldPackageName]) {
				delete deps[oldPackageName];
				deps[newPackageName] = newVersion;
			}
		}
		return json;
	});

	visitNotIgnoredFiles(tree, '.', (file) => {
		if (!file.endsWith('.ts')) return;

		let content = tree.read(file, 'utf-8');
		if (!content) return;

		const importRegex = new RegExp(oldPackageName, 'g');
		content = content.replace(importRegex, newPackageName);

		tree.write(file, content);
		console.log(`Updated imports in ${file}`);
	});

	formatFiles(tree);
}
