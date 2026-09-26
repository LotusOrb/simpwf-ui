export interface Secret {
	key: string;
	/** Always masked by the API; secret values are write-only. */
	value_masked: string;
	created_at: string;
	updated_at: string;
}
