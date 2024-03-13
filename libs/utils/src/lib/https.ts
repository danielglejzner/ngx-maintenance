import { get, request, RequestOptions } from 'https';
import { URL } from 'url';

export function httpsGet<T extends any>(url: string | URL): Promise<T> {
	const urlString = typeof url === 'string' ? url : url.toString();
	return new Promise((resolve, reject) => {
		get(urlString, res => {
			if (res.statusCode === 429) {
				return reject(new Error('Rate limited by the API'));
			} else if (res.statusCode && (res.statusCode < 200 || res?.statusCode >= 300)) {
				return reject(new Error(`HTTP Status Code: ${res.statusCode}`));
			}
			let data = '';
			res.on('data', chunk => data += chunk);
			res.on('end', () => resolve(JSON.parse(data)));
		}).on('error', reject);
	});
}

export function httpsRequest<T extends any>(options: string | URL | RequestOptions): Promise<T> {
	return new Promise((resolve, reject) => {
		const req = request(options, res => {
			if (res.statusCode === 429) {
				return reject(new Error('Rate limited by the API'));
			} else if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
				return reject(new Error(`HTTP Status Code: ${res.statusCode}`));
			}

			let data = '';
			res.on('data', chunk => data += chunk);
			res.on('end', () => resolve(JSON.parse(data)));
		});

		req.on('error', reject);
		req.end();
	});
}