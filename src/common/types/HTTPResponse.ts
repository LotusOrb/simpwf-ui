import type { ComplexQueryParam } from './ComplexQueryParam';

export type HTTPResponse<T> = {
	code: number;
	message: string;
	explain: string;
	data: T;
	param: ComplexQueryParam;
};
