export interface PackageMetadata {
	_id?: string;
	_rev?: string;
	name: string;
	"dist-tags": DistTags;
	versions: { [version: string]: Version };
	time?: Time;
	maintainers?: Human[];
	description?: string;
	readme?: string;
	readmeFilename?: string;
	homepage?: string;
	repository?: Repository;
	bugs?: Bugs;
	license?: string;
	users?: { [username: string]: boolean };
	author?: Human;
	contributors?: Human[];
	keywords?: string[];
}

interface DistTags {
	latest: string;
	[tag: string]: string;
}

interface Version {
	_id?: string;
	_from?: string;
	_nodeVersion?: string;
	_npmVersion?: string;
	_npmUser?: Human;
	_shasum?: string;
	_hasShrinkwrap?: boolean;
	author?: Human;
	name: string;
	version: string;
	description?: string;
	main?: string;
	scripts?: { [script: string]: string };
	dist: Dist;
	directories?: Directories;
	dependencies?: { [packageName: string]: string };
	devDependencies?: { [packageName: string]: string };
	peerDependencies?: { [packageName: string]: string };
	optionalDependencies?: { [packageName: string]: string };
	bundleDependencies?: string[];
	peerDependenciesMeta?: { [packageName: string]: PeerDependenciesMeta };
	engines?: Engines;
	os?: string[];
	cpu?: string[];
	maintainers?: Human[];
	license?: string;
	readme?: string;
	readmeFilename?: string;
	repository?: Repository;
	bugs?: { url: string };
	homepage?: string;
	hasInstallScript?: boolean;
}

interface Time {
	created: string;
	modified: string;
	[version: string]: string;
}

interface Human {
	name: string;
	email?: string;
	url?: string;
}

interface Dist {
	shasum: string;
	tarball: string;
	integrity?: string;
	fileCount?: number;
	unpackedSize?: number;
	"npm-signature"?: string;
}

interface Directories {
	[key: string]: unknown;
}

interface Repository {
	type: string;
	url: string;
}

interface PeerDependenciesMeta {
	optional?: boolean;
}

interface Engines {
	node?: string;
	npm?: string;
}

export interface PackageJson {
	name: string;
	version: string;
	description?: string;
	keywords?: string[];
	homepage?: string;
	bugs?: Bugs | string;
	license?: string;
	author?: Human | string;
	contributors?: (Human | string)[];
	main?: string;
	types?: string;
	scripts?: Record<string, string>;
	repository?: Repository | string;
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	peerDependencies?: Record<string, string>;
	optionalDependencies?: Record<string, string>;
	bundleDependencies?: string[];
	engines?: Engines;
	os?: string[];
	cpu?: string[];
	private?: boolean;
	publishConfig?: PublishConfig;
	directories?: Directories;
	bin?: Record<string, string>; // Binary files
	files?: string[]; // Array of files to include in the npm package
	peerDependenciesMeta?: Record<string, PeerDependenciesMeta>;
	config?: Record<string, unknown>; // Custom config parameters
}

interface Engines {
	node?: string;
	npm?: string;
	yarn?: string; // If you're specifying yarn version
}

interface PublishConfig {
	registry?: string;
	access?: "public" | "restricted";
	tag?: string;
}

interface Human {
	name: string;
	email?: string;
	url?: string;
}

interface Repository {
	type: string;
	url: string;
	directory?: string; // If the package is in a subdirectory of a monorepo
}

interface Bugs {
	url?: string;
	email?: string;
}

interface PeerDependenciesMeta {
	optional?: boolean;
}

interface Directories {
	lib?: string; // Library files
	bin?: string; // Executable files
	man?: string; // Manual pages
	doc?: string; // Documentation files
	example?: string; // Example files
}