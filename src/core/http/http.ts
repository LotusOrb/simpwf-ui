import axios, { Axios, type AxiosResponse } from 'axios';

import type { ComplexQueryParam } from '@common/types/ComplexQueryParam';
import type { HTTPHeader } from '@common/types/HTTPHeader';
import type { HTTPMethod } from '@common/types/HTTPMethod';
import type { HTTPResponse } from '@common/types/HTTPResponse';

export class Http {
  private instance: Axios;
  private baseURL: string;
  // TODO: should have it's own config instance
  private config: Record<string, string> = {};

  constructor(url: string | (() => string)) {
    this.baseURL = typeof url === 'function' ? url() : url;
    this.instance = axios.create({ timeout: 3600 });
  }

  private createHeader(head: HTTPHeader): Record<string, string> {
    const h = new Headers();
    Object.keys(head).map((ctx) => h.set(ctx, head[ctx]));
    return Object.fromEntries(h.entries());
  }

  private parseResponse<T>(res: AxiosResponse<T>, qParam: ComplexQueryParam): HTTPResponse<T> {
    return {
      code: 200,
      data: res.data,
      explain: '',
      message: '',
      param: qParam,
    };
  }

  public parseComplexQueryPram(qParam?: ComplexQueryParam) {
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

    if (qParam?.filter) {
      Object.entries(qParam?.filter).map(([k, v]) => {
        if (Array.isArray(v?.value)) {
          u.set(k, v?.value.join(','));
        }
        if (typeof v?.value !== 'undefined' && !Array.isArray(v.value)) {
          u.set(k, v?.value?.toString());
        }
      });
    }

    const s: string = u.toString();

    return u ? `?${s}` : s;
  }

  public requestJSON(method: HTTPMethod, url: string, qParam?: ComplexQueryParam, body?: unknown) {
    const h = this.createHeader({
      'Content-Type': 'Application/json',
    });
    if (method === 'get' || method === 'delete' || method === 'head') {
      return this.instance[method]('', { headers: h });
    } else {
      return this.instance[method](url, body);
    }
  }
}
