import { Tree, updateJson, addDependenciesToPackageJson, formatFiles, visitNotIgnoredFiles } from '@nx/devkit';

export function toMaintenanceInitiative(tree: Tree, oldPackageName: string, newVersion = "1.0.0") {
	updateJson(tree, 'package.json', (json) => {
		for (const deps of [json.dependencies, json.devDependencies]) {
			if (deps) {
				delete deps[oldPackageName];
			}
		}

		return json;
	});

	addDependenciesToPackageJson(tree, { [`@ngx-maintenance/${oldPackageName}`]: newVersion }, {});

	visitNotIgnoredFiles(tree, '.', (file) => {
		if (!file.endsWith('.ts')) return;

		let content = tree.read(file, 'utf-8');
		if (!content) return;

		const importRegex = new RegExp(oldPackageName, 'g');
		content = content.replace(importRegex, `@ngx-maintenance/${oldPackageName}`);

		tree.write(file, content.replace(importRegex, `@ngx-maintenance/${oldPackageName}`));
		console.log(`Updated imports in ${file}`);
	});

	formatFiles(tree);
}