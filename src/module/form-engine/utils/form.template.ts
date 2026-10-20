import { get } from 'es-toolkit/compat';

import type { FormRemoteOptions } from '@module/form-engine/types/FormRemoteOptions';

import { isEmptyValue, resolveConditionPath } from './form.condition';

/** `{{ field.a.b }}`, `{{ context.a.b }}` or `{{ search }}`, spaces optional. */
const TOKEN = /\{\{\s*(field|context)\.([A-Za-z0-9_.*-]+)\s*\}\}|\{\{\s*(search)\s*\}\}/g;

/** One whole-string token, so a JSON body can take the value with its own type. */
const WHOLE_TOKEN = /^\s*\{\{\s*(?:(field|context)\.([A-Za-z0-9_.*-]+)|(search))\s*\}\}\s*$/;

export interface FormTemplateScope {
	/** The form values; `field.*` reads from here. */
	values: unknown;
	/** The run context; `context.*` reads from here. */
	context: unknown;
	search: string;
	/** Concrete path of the field being resolved, so `field.items.*.x` stays within its own repeater item. */
	at: string;
}

export interface FormTemplateToken {
	source: 'field' | 'context' | 'search';
	/** Dotted path; empty for `search`. */
	path: string;
}

const tokenOf = (match: RegExpMatchArray | RegExpExecArray): FormTemplateToken =>
	match[3] ? { source: 'search', path: '' } : { source: match[1] as 'field' | 'context', path: match[2] };

const stringLeaves = (value: unknown): string[] => {
	if (typeof value === 'string') return [value];
	if (Array.isArray(value)) return value.flatMap(stringLeaves);
	if (value && typeof value === 'object') return Object.values(value).flatMap(stringLeaves);
	return [];
};

/** Every token used anywhere in a remote request: URL, headers and body. */
export const remoteTokens = (options: FormRemoteOptions): FormTemplateToken[] => {
	const texts = [options.url, ...Object.values(options.headers ?? {}), ...stringLeaves(options.body)];
	const seen = new Map<string, FormTemplateToken>();
	for (const text of texts) {
		for (const match of text.matchAll(TOKEN)) {
			const token = tokenOf(match);
			seen.set(`${token.source}:${token.path}`, token);
		}
	}
	return [...seen.values()];
};

/** The form fields a remote request reads, by `ui` path; the request reloads when any of them changes. */
export const remoteDependencies = (options: FormRemoteOptions) =>
	remoteTokens(options)
		.filter((token) => token.source === 'field')
		.map((token) => token.path);

const lookup = (token: FormTemplateToken, scope: FormTemplateScope): unknown => {
	if (token.source === 'search') return scope.search;
	if (token.source === 'context') return get(scope.context, token.path);
	return get(scope.values, resolveConditionPath(token.path, scope.at));
};

const asText = (value: unknown) =>
	typeof value === 'string' ? value : Array.isArray(value) ? value.join(',') : JSON.stringify(value);

export interface FormTemplateResult<T> {
	value: T;
	/** Tokens with no value yet, as written (`field.country`); `search` never counts as missing. */
	missing: string[];
}

/** Fills the tokens in `text`. URL parts are percent-encoded; anything else is inserted as is. */
export const resolveTemplate = (
	text: string,
	scope: FormTemplateScope,
	encode: boolean,
): FormTemplateResult<string> => {
	const missing: string[] = [];
	const value = text.replace(TOKEN, (...match) => {
		const token = tokenOf(match as unknown as RegExpMatchArray);
		const found = lookup(token, scope);
		if (token.source !== 'search' && isEmptyValue(found)) {
			missing.push(`${token.source}.${token.path}`);
			return '';
		}
		const raw = found === undefined || found === null ? '' : asText(found);
		return encode ? encodeURIComponent(raw) : raw;
	});
	return { value, missing };
};

/** Fills string leaves of a JSON body. A leaf that is one whole token takes the value itself, typed. */
export const resolveBody = (body: unknown, scope: FormTemplateScope): FormTemplateResult<unknown> => {
	const missing: string[] = [];
	const walk = (value: unknown): unknown => {
		if (typeof value === 'string') {
			const whole = value.match(WHOLE_TOKEN);
			if (whole) {
				const token = tokenOf(whole);
				const found = lookup(token, scope);
				if (token.source !== 'search' && isEmptyValue(found)) missing.push(`${token.source}.${token.path}`);
				return found ?? '';
			}
			const result = resolveTemplate(value, scope, false);
			missing.push(...result.missing);
			return result.value;
		}
		if (Array.isArray(value)) return value.map(walk);
		if (value && typeof value === 'object') {
			return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, walk(item)]));
		}
		return value;
	};
	return { value: walk(body), missing };
};
