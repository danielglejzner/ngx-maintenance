/**
 * Interface representing registry search query params.
 */
export interface SearchQueryParams {
	text?: string;
	size?: number;
	from?: number;
	quality?: number;
	popularity?: number;
	maintenance?: number;
}
/**
 * Interface representing registry search response.
 */
export interface SearchResponse {
	objects: SearchResult[];
	total: number;
	time: string;
}

interface SearchResult {
	package: Package;
	score: Score;
	searchScore: number;
}

interface Package {
	name: string;
	version: string;
	description: string;
	keywords: string[];
	date: string;
	links: Links;
	publisher: Publisher;
	maintainers: Maintainer[];
}

interface Links {
	npm: string;
	homepage: string;
	repository: string;
	bugs: string;
}

interface Publisher {
	username: string;
	email: string;
}

interface Maintainer extends Publisher {
}

interface Score {
	final: number;
	detail: {
		quality: number;
		popularity: number;
		maintenance: number;
	};
}
