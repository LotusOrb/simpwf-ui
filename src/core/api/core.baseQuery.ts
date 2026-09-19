import type { BaseQueryFn } from '@reduxjs/toolkit/query';

import { config } from '@config/config';

import { AUTH_TOKEN_HEADER } from '@core/auth/auth.constants';
import { clearToken } from '@core/auth/store';
import { Http } from '@core/http';

import { HTTPError } from '@common/exception/HTTPError';
import type { ComplexQueryParam } from '@common/types/ComplexQueryParam';
import type { HTTPHeader } from '@common/types/HTTPHeader';
import type { HTTPMethod } from '@common/types/HTTPMethod';
import type { HTTPResponse } from '@common/types/HTTPResponse';

export interface CoreQueryArgs {
	method: HTTPMethod;
	url: string;
	qParam?: ComplexQueryParam;
	body?: unknown;
	head?: HTTPHeader;
}

export interface CoreQueryError {
	code: number;
	data: string;
	explain: string;
	message: string;
}

export interface CoreQueryExtraOptions {
	anonymous?: boolean;
}

export interface CoreQueryMeta {
	code: number;
	explain: string;
	param: ComplexQueryParam;
}

let httpPromise: Promise<Http> | null = null;

const getHttp = (): Promise<Http> => {
	httpPromise ??= config.getValue().then((value) => new Http(value.SIMPWF_UI_API));
	return httpPromise;
};

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

export const coreBaseQuery: BaseQueryFn<
	CoreQueryArgs,
	unknown,
	CoreQueryError,
	CoreQueryExtraOptions,
	CoreQueryMeta
> = async (args, api, extraOptions) => {
	try {
		const http = await getHttp();
		const head: HTTPHeader = {};

		if (!extraOptions?.anonymous) {
			const token = (api.getState() as { auth?: { token?: string | null } }).auth?.token;
			if (token) head[AUTH_TOKEN_HEADER] = token;
		}

		Object.assign(head, args.head);

		const res: HTTPResponse<unknown> = await http.requestJSON(args.method, args.url, args.qParam, args.body, head);

		return { data: res.data, meta: { code: res.code, explain: res.explain, param: res.param } };
	} catch (err) {
		const error = toCoreQueryError(err);
		if (error.code === 401 && !extraOptions?.anonymous) api.dispatch(clearToken());

		return { error };
	}
};
