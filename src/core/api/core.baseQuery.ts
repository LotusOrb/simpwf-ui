import type { BaseQueryFn } from '@reduxjs/toolkit/query';

import { config } from '@config/config';

import { Http } from '@core/http';

import { HTTPError } from '@common/exception/HTTPError';
import type { ComplexQueryParam } from '@common/types/ComplexQueryParam';
import type { HTTPHeader } from '@common/types/HTTPHeader';
import type { HTTPMethod } from '@common/types/HTTPMethod';
import type { HTTPResponse } from '@common/types/HTTPResponse';

/** What every endpoint's `query()` returns. Mirrors `Http.requestJSON`. */
export interface CoreQueryArgs {
	method: HTTPMethod;
	url: string;
	qParam?: ComplexQueryParam;
	body?: unknown;
	head?: HTTPHeader;
}

/**
 * `HTTPError` is a class, and RTK Query keeps errors in the store, so it has to
 * be flattened into something serializable before it crosses the boundary.
 */
export interface CoreQueryError {
	code: number;
	data: string;
	explain: string;
	message: string;
}

/** Extra knobs an endpoint can pass through `extraOptions`. */
export interface CoreQueryExtraOptions {
	/** Skip the Authorization header (login, public config, ...). */
	anonymous?: boolean;
}

export interface CoreQueryMeta {
	code: number;
	explain: string;
	param: ComplexQueryParam;
}

/**
 * `Config.getValue()` is async, so the transport cannot be built at module
 * scope. It is created once, on the first request, and reused after that.
 */
let httpPromise: Promise<Http> | null = null;

const getHttp = (): Promise<Http> => {
	httpPromise ??= config.getValue().then((value) => new Http(value.APP_SIMPWF_URL));
	return httpPromise;
};

/** Test/HMR escape hatch: forget the memoized transport. */
export const resetCoreHttp = () => {
	httpPromise = null;
};

const toCoreQueryError = (err: unknown): CoreQueryError => {
	if (err instanceof HTTPError) {
		return { code: err.code, data: err.data, explain: err.explain, message: err.message };
	}

	return {
		code: 500,
		data: 'Unknown Error',
		explain: 'Unknown Error',
		message: err instanceof Error ? err.message : 'Unknown Error',
	};
};

/**
 * Unwraps the `HTTPResponse<T>` envelope so endpoints only ever see `T`, and
 * parks the envelope's metadata on `meta` for the rare caller that needs it.
 */
export const coreBaseQuery: BaseQueryFn<
	CoreQueryArgs,
	unknown,
	CoreQueryError,
	CoreQueryExtraOptions,
	CoreQueryMeta
> = async (args, api, extraOptions) => {
	try {
		const http = await getHttp();
		const head: HTTPHeader = { ...args.head };

		if (!extraOptions?.anonymous) {
			// Imported lazily-by-cast to keep `core/api` free of a store import cycle.
			const token = (api.getState() as { auth?: { token?: string | null } }).auth?.token;
			if (token) head.Authorization = `Bearer ${token}`;
		}

		const res: HTTPResponse<unknown> = await http.requestJSON(args.method, args.url, args.qParam, args.body, head);

		return { data: res.data, meta: { code: res.code, explain: res.explain, param: res.param } };
	} catch (err) {
		return { error: toCoreQueryError(err) };
	}
};
