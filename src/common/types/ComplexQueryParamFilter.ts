export type ComplexQueryParamFilter<T extends string = string> = Partial<
	Record<
		T,
		{
			//TODO: add another operator for other type of filter
			op: '_eq';
			value: string | string[] | number | number[];
		}
	>
>;
