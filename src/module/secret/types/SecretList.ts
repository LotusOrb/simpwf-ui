import type { Secret } from './Secret';

export interface SecretList {
	items: Secret[];
	page: number;
	per_page: number;
	total: number;
	total_pages: number;
}
