export type ComplexQueryParamFilter = Record<string, undefined | string | string[] | number | number[]>;

export type ComplexQueryParam = {
	page?: number;
	perPage?: number;
	search?: string;
	order?: {
		by: string;
		direction: string;
	};
};
