import type { BaseQueryFn } from '@reduxjs/toolkit/query';

import { config } from '@config/config';

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
	httpPromise ??= config.getValue().then((value) => new Http(value.APP_SIMPWF_URL));
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
		const head: HTTPHeader = { ...args.head };

		if (!extraOptions?.anonymous) {
			const token = (api.getState() as { auth?: { token?: string | null } }).auth?.token;
			if (token) head.Authorization = `Bearer ${token}`;
		}

		const res: HTTPResponse<unknown> = await http.requestJSON(args.method, args.url, args.qParam, args.body, head);

		return { data: res.data, meta: { code: res.code, explain: res.explain, param: res.param } };
	} catch (err) {
		return { error: toCoreQueryError(err) };
	}
};
