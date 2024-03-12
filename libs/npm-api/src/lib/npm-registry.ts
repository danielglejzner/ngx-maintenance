import { satisfies } from 'semver';
import { tryCatch, httpsGet } from '@ngx-maintenance/devkit';
import { RegistryInfo } from './interfaces/registry-info';
import { SearchQueryParams, SearchResponse } from './interfaces/search';
import { PackageJson, PackageMetadata } from './interfaces/package';

/**
 * Custom error class for NpmApiError.
 */
class NpmApiError extends Error {
	/**
	 * Constructs a new NpmApiError instance.
	 * @param message The error message.
	 * @param statusCode Optional HTTP status code associated with the error.
	 */
	constructor(public override message: string, public statusCode?: number) {
		super(message);
		this.name = "NpmApiError";
	}
}
type ValueOf<Obj> = Obj[keyof Obj];
type OneOnly<Obj, Key extends keyof Obj> = { [key in Exclude<keyof Obj, Key>]+?: undefined } & Pick<Obj, Key>;
type OneOfByKey<Obj> = { [key in keyof Obj]: OneOnly<Obj, key> };
type OneOfType<Obj> = ValueOf<OneOfByKey<Obj>>;

/**
 * Type representing either data or error response.
 */
type ApiResponse<T> = OneOfType<{ data: T; error: NpmApiError; }>;

/**
 * Represents endpoint response types.
 */
interface EndpointResponseTypes {
	"/": { response: RegistryInfo };
	"/-/v1/search": { response: SearchResponse, queryParams: SearchQueryParams };
}

/**
 * Extracts query parameter types for a given endpoint.
 */
type QueryParamsType<Endpoint extends keyof EndpointResponseTypes> =
	EndpointResponseTypes[Endpoint] extends { queryParams: infer QP } ? QP : never;

/**
 * Represents endpoint response types.
 */
type EndpointResponse<Endpoint extends keyof EndpointResponseTypes> =
	EndpointResponseTypes[Endpoint] extends { response: infer QP } ? QP : never;

/**
 * Extracts parameters from a string pattern.
 */
type ExtractParams<T extends string> = T extends `/${infer Params}` ? { params: Record<string, string>; } : never;

/**
 * Represents dynamic endpoint configuration.
 */
type DynamicEndpointConfig = {
	"/{package:string}": ExtractParams<"/{package:string}"> & { response: PackageMetadata };
	"/{package:string}/{version:string}": ExtractParams<"/{package:string}/{version:string}"> & { response: PackageJson };
};

/**
 * Represents dynamic response type for a pattern.
 */
type DynamicResponseType<Pattern extends keyof DynamicEndpointConfig> = DynamicEndpointConfig[Pattern]['response'];

/**
 * Represents dynamic parameters type for a pattern.
 */
type DynamicParamsType<Pattern extends keyof DynamicEndpointConfig> = DynamicEndpointConfig[Pattern]['params'];

/**
 * Represents dynamic query parameter type for a pattern.
 */
type DynamicQueryParamsType<Pattern extends keyof DynamicEndpointConfig> =
	DynamicEndpointConfig[Pattern] extends { queryParams: infer QP } ? QP : never;

/**
 * Fetches data from the npm API.
 * @param endpoint Endpoint or pattern to fetch.
 * @param queryParams Query parameters for the endpoint.
 * @returns Promise resolving to ApiResponse.
 */
export async function fetchNpmApi<Endpoint extends keyof EndpointResponseTypes>(
	endpoint: Endpoint,
	queryParams?: QueryParamsType<Endpoint>
): Promise<ApiResponse<EndpointResponse<Endpoint>>>;

/**
 * Fetches data from the npm API for dynamic endpoints.
 * @param pattern Pattern for dynamic endpoint.
 * @param dynamicParams Dynamic parameters for the pattern.
 * @param queryParams Query parameters for the endpoint.
 * @returns Promise resolving to ApiResponse.
 */
export async function fetchNpmApi<Pattern extends keyof DynamicEndpointConfig>(
	pattern: Pattern,
	dynamicParams: DynamicParamsType<Pattern>,
	queryParams?: DynamicQueryParamsType<Pattern>
): Promise<ApiResponse<DynamicResponseType<Pattern>>>;

export async function fetchNpmApi(
	endpointOrPattern: string,
	paramsOrQuery?: DynamicParamsType<any> | QueryParamsType<any>,
	queryParams?: DynamicQueryParamsType<any>
): Promise<ApiResponse<any>> {
	const url = new URL(`https://registry.npmjs.org${endpointOrPattern}`);
	if (paramsOrQuery && typeof paramsOrQuery === 'object') {
		Object.entries(paramsOrQuery).forEach(([key, value]) => {
			if (value !== undefined) {
				url.pathname = url.pathname.replace(`{${key}}`, value?.toString() || '');
			}
		});
	}
	if (queryParams && typeof queryParams === 'object') {
		Object.entries(queryParams).forEach(([key, value]) => {
			if (value !== undefined) {
				url.searchParams.append(key, value.toString());
			}
		});
	}
	const { error, result: response } = await tryCatch(async () => await httpsGet(url));

	if (error) {
		return { error: new NpmApiError(error.message) };
	}

	return { data: response };
}

/**
 * Finds a compatible version for a package.
 * @param packageName The name of the package.
 * @param versionRange The version range.
 * @param peerDependency The peer dependency.
 * @returns Promise resolving to compatible version or null.
 */
export async function findCompatibleVersion(packageName: string, versionRange: string, peerDependency: string): Promise<string | null> {
	const { data: packageInfo, error } = await fetchNpmApi('/{package:string}', { packageName });
	if (error) {
		throw error
	}
	const versions = Object.keys(packageInfo.versions);
	const compatibleVersion = versions.find(version => {
		const versionPackageJson = packageInfo.versions[version];
		const packages = { ...(versionPackageJson.dependencies || {}), ...(versionPackageJson.devDependencies || {}), ...(versionPackageJson.peerDependencies || {}) };
		return satisfies(packages[peerDependency], versionRange);
	});

	return compatibleVersion || null;
}
