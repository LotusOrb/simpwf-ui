import type { Role } from './Role';

/** The role catalog is small and served whole, so it is not paginated. */
export interface RoleList {
	items: Role[];
}
