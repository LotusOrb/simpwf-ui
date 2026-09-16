export type ComplexQueryParamFilter<T extends string = string> = Partial<
    Record<T, string | string[] | number | number[]>
>;

