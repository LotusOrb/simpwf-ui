import { get } from 'es-toolkit/compat';

import type { FormRemoteOption } from '@module/form-engine/types/FormRemoteOption';
import type { FormRemoteOptions } from '@module/form-engine/types/FormRemoteOptions';

import { type FormTemplateScope, resolveBody, resolveTemplate } from './form.template';

export interface FormRemoteRequest {
	url: string;
	method: 'GET' | 'POST';
	headers: Record<string, string>;
	body?: string;
}

/** The request a remote select would send now, or the tokens that still have no value. */
export const buildRemoteRequest = (
	options: FormRemoteOptions,
	scope: FormTemplateScope,
): { request: FormRemoteRequest | null; missing: string[] } => {
	const url = resolveTemplate(options.url, scope, true);
	const missing = [...url.missing];
	const headers: Record<string, string> = {};
	for (const [name, value] of Object.entries(options.headers ?? {})) {
		const resolved = resolveTemplate(value, scope, false);
		missing.push(...resolved.missing);
		headers[name] = resolved.value;
	}

	let body: string | undefined;
	if (options.method === 'POST' && options.body !== undefined) {
		const resolved = resolveBody(options.body, scope);
		missing.push(...resolved.missing);
		body = JSON.stringify(resolved.value);
		if (!Object.keys(headers).some((name) => name.toLowerCase() === 'content-type')) {
			headers['Content-Type'] = 'application/json';
		}
	}

	const unique = [...new Set(missing)];
	return unique.length
		? { request: null, missing: unique }
		: { request: { url: url.value, method: options.method, headers, body }, missing: [] };
};

/** Identifies a request for the per-form cache. */
export const remoteRequestKey = (request: FormRemoteRequest) =>
	JSON.stringify([request.method, request.url, request.headers, request.body ?? null]);

export class FormRemoteError extends Error {
	/** A network-level failure, which from a browser is most often CORS. */
	readonly network: boolean;

	constructor(message: string, network = false) {
		super(message);
		this.name = 'FormRemoteError';
		this.network = network;
	}
}

/**
 * Sends the request with plain `fetch` and no credentials: the target is a third party, so neither the engine's
 * auth header nor the browser's cookies go along.
 */
export const fetchRemote = async (request: FormRemoteRequest, signal?: AbortSignal): Promise<unknown> => {
	let response: Response;
	try {
		response = await fetch(request.url, {
			method: request.method,
			headers: request.headers,
			body: request.body,
			credentials: 'omit',
			signal,
		});
	} catch (error) {
		if (error instanceof DOMException && error.name === 'AbortError') throw error;
		throw new FormRemoteError(
			"Couldn't reach the server. If it works elsewhere, it probably doesn't allow requests from this site (CORS).",
			true,
		);
	}
	if (!response.ok) throw new FormRemoteError(`The server answered ${response.status} ${response.statusText}`.trim());
	try {
		return await response.json();
	} catch {
		throw new FormRemoteError("The response isn't JSON");
	}
};

/** Options out of a response: the list at `itemsPath`, each mapped by `valuePath` and `labelPath`. */
export const mapRemoteOptions = (response: unknown, options: FormRemoteOptions): FormRemoteOption[] => {
	const items = options.itemsPath ? get(response, options.itemsPath) : response;
	if (!Array.isArray(items)) {
		throw new FormRemoteError(
			options.itemsPath
				? `Nothing at "${options.itemsPath}" is a list`
				: 'The response is not a list; set the items path',
		);
	}

	const seen = new Set<string>();
	return items.flatMap((item): FormRemoteOption[] => {
		const raw = options.valuePath ? get(item, options.valuePath) : item;
		if (typeof raw !== 'string' && typeof raw !== 'number') return [];
		if (seen.has(String(raw))) return [];
		seen.add(String(raw));
		const label = options.labelPath ? get(item, options.labelPath) : undefined;
		return [{ value: raw, label: label === undefined || label === null ? String(raw) : String(label) }];
	});
};
