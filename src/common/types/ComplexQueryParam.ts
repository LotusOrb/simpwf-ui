export type ComplexQueryParamFilter = {}

export type ComplexQueryParam = {
    page?: number;
    perPage?: number;
    search?: string;
    order?: {
        by: string;
        direction: string;
    }
}