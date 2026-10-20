import type { Form } from './Form';

export interface FormList {
	items: Form[];
	page: number;
	per_page: number;
	total: number;
	total_pages: number;
}
