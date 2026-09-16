import { Axios } from 'axios';

import type { ComplexQueryParam } from '@common/types/ComplexQueryParam';

// TODO: Move to common type
type HTTPMethod = 'get' | 'post' | 'put' | 'patch' | 'head';
// TODO: Move to common type
type HTTPHeader = Record<string, string>;

export class Http {
	private instance: Axios;
	// TODO: should have it's own config instance
	private config: Record<string, string> = {};

	constructor(url: () => string | string) {
		this.instance = new Axios({
			baseURL: typeof url === 'function' ? url() : url,
		});
	}

	private createHeader(head: HTTPHeader): Headers {
		const h = new Headers();
		Object.keys(head).map((ctx) => h.set(ctx, head[ctx]));
		return h;
	}

	private praseComplexQueryPram(qParam?: ComplexQueryParam) {
		const u = new URLSearchParams();

		if (qParam?.page) {
			u.set('page', String(qParam.page));
		}
		if (qParam?.page) {
			u.set('page', String(qParam.perPage));
		}
		if (qParam?.search) {
			u.set('search', qParam.search);
		}

		if (qParam?.order?.by && qParam?.order?.direction) {
			u.set('order', `${qParam.order.direction === 'asc' ? '-' : ''}${qParam.order.by}`);
		}

    return u.toString()
	}

	public requestJSON(method: HTTPMethod, url: string, qParam?: ComplexQueryParam, body?: unknown) {
		const h = this.createHeader({});
	}
}
