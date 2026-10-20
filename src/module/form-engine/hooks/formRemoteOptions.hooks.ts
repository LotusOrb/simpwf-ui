import { useEffect, useState } from 'react';

import { useDebouncedValue } from '@mantine/hooks';

import { FORM_REMOTE_DEFAULT_DEBOUNCE_MS, FORM_REMOTE_DEFAULT_MIN_CHARS } from '@module/form-engine/constant';
import type { FormEngine } from '@module/form-engine/types/FormEngine';
import type { FormRemoteOption } from '@module/form-engine/types/FormRemoteOption';
import type { FormRemoteOptions } from '@module/form-engine/types/FormRemoteOptions';
import {
	FormRemoteError,
	buildRemoteRequest,
	fetchRemote,
	mapRemoteOptions,
	remoteRequestKey,
} from '@module/form-engine/utils';

interface RemoteLoad {
	key: string;
	items: FormRemoteOption[];
	error: string | null;
}

export interface FormRemoteOptionsState {
	items: FormRemoteOption[];
	loading: boolean;
	error: string | null;
	/** Tokens with no value yet, e.g. `field.country`; the select waits for them. */
	missing: string[];
	/** Server-side search is on and the term is shorter than `minChars`. */
	tooShort: boolean;
	searchable: boolean;
	search: string;
	setSearch: (search: string) => void;
	retry: () => void;
	/** Changes whenever the request does, minus the search term; a new one means earlier picks may be stale. */
	dependencyKey: string;
}

/** Options of a remote select at `path`: reloaded when the fields it reads change, debounced while searching. */
export const useRemoteOptions = (
	engine: FormEngine,
	options: FormRemoteOptions,
	path: string,
): FormRemoteOptionsState => {
	const searchable = !!options.search;
	const minChars = options.search?.minChars ?? FORM_REMOTE_DEFAULT_MIN_CHARS;
	const [search, setSearch] = useState('');
	const [debounced] = useDebouncedValue(search, options.search?.debounceMs ?? FORM_REMOTE_DEFAULT_DEBOUNCE_MS);
	const [attempt, setAttempt] = useState(0);
	const [load, setLoad] = useState<RemoteLoad | null>(null);

	const scope = { values: engine.form.getValues(), context: engine.context, at: path };
	const term = searchable ? debounced.trim() : '';
	const tooShort = searchable && term.length < minChars;
	const built = buildRemoteRequest(options, { ...scope, search: term });
	const key = built.request ? remoteRequestKey(built.request) : null;
	const dependencyKey = JSON.stringify(buildRemoteRequest(options, { ...scope, search: '' }));
	const cached = key ? engine.remoteCache.get(key) : undefined;

	useEffect(() => {
		if (!built.request || !key || tooShort || engine.remoteCache.has(key)) return;
		const controller = new AbortController();
		fetchRemote(built.request, controller.signal)
			.then((response) => {
				const items = mapRemoteOptions(response, options);
				engine.remoteCache.set(key, items);
				setLoad({ key, items, error: null });
			})
			.catch((error: unknown) => {
				if (controller.signal.aborted) return;
				setLoad({
					key,
					items: [],
					error: error instanceof FormRemoteError ? error.message : 'Failed to load options',
				});
			});
		// A newer request supersedes this one.
		return () => controller.abort();
		// `built.request` is identified by `key`.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [key, tooShort, attempt]);

	const current = load?.key === key ? load : null;
	return {
		items: cached ?? current?.items ?? [],
		loading: !!key && !tooShort && !cached && !current,
		error: cached ? null : (current?.error ?? null),
		missing: built.missing,
		tooShort,
		searchable,
		search,
		setSearch,
		retry: () => {
			setLoad(null);
			setAttempt((value) => value + 1);
		},
		dependencyKey,
	};
};
