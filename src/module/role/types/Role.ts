export interface Role {
	name: string;
	/** Derived from configuration; roles are not hand-authored. */
	description?: string | null;
	/** Actions the role grants, as the live catalog defines them. May include the `*` wildcard. */
	permissions: string[];
	created_at: string;
	updated_at: string;
}
