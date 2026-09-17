export type ComplexQueryParamFilter<T extends string = string> = Partial<
	Record<T, { op: string; value: string | string[] | number | number[] }>
>;
