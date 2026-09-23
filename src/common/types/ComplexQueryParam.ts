import type { ComplexQueryParamFilter } from './ComplexQueryParamFilter';

export type ComplexQueryParam<T extends string = string> = {
	page?: number;
	perPage?: number;
	search?: string;
	filter?: ComplexQueryParamFilter<T>;
	order?: {
		by?: string;
		direction?: string;
	};
};
