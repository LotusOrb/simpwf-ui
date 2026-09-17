import axios, { Axios, type AxiosRequestConfig, type AxiosResponse } from 'axios';

import { HTTPError } from '@common/exception/HTTPError';
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
    this.instance = axios.create({ baseURL: this.baseURL, timeout: 3600 });
  }

  private createHeader(head: HTTPHeader): Record<string, string> {
    const h = new Headers();
    Object.keys(head).map((ctx) => h.set(ctx, head[ctx]));
    return Object.fromEntries(h.entries());
  }

  private parseResponse<T>(res: AxiosResponse<T>, qParam?: ComplexQueryParam): HTTPResponse<T> {
    return {
      code: res.status,
      data: res.data,
      explain: res.statusText,
      message: res.statusText,
      param: qParam ?? {},
    };
  }

  private parseError(err: unknown): HTTPError {
    if (err instanceof HTTPError) {
      return err;
    }

    if (axios.isAxiosError<Partial<HTTPResponse<string>>>(err)) {
      const res = err.response;
      return new HTTPError(
        res?.status,
        res?.data?.data,
        res?.data?.explain ?? err.code,
        res?.data?.message ?? err.message,
      );
    }

    return new HTTPError(500, undefined, undefined, err instanceof Error ? err.message : undefined);
  }

   private parseComplexQueryPram(qParam?: ComplexQueryParam) {
    const u = new URLSearchParams();

    if (typeof qParam?.page !== 'undefined') {
      u.set('page', String(qParam.page));
    }
    if (typeof qParam?.perPage !== 'undefined') {
      u.set('perPage', String(qParam.perPage));
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

    return s ? `?${s}` : s;
  }

  public async requestJSON<T>(
    method: HTTPMethod,
    url: string,
    qParam?: ComplexQueryParam,
    body?: unknown,
  ): Promise<HTTPResponse<T>> {
    const h = this.createHeader({
      'Content-Type': 'application/json',
    });

    const cfg: AxiosRequestConfig = {
      method,
      url: `${url}${this.parseComplexQueryPram(qParam)}`,
      headers: h,
    };

    if (method !== 'get' && method !== 'delete' && method !== 'head') {
      cfg.data = body;
    }

    try {
      const res = await this.instance.request<T>(cfg);
      return this.parseResponse<T>(res, qParam);
    } catch (err) {
      throw this.parseError(err);
    }
  }
}
