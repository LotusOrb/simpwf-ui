/** Where a remote-select loads its options. String parts may use `{{ field.x }}`, `{{ context.x }}`, `{{ search }}`. */
export interface FormRemoteOptions {
	url: string;
	method: 'GET' | 'POST';
	/** Stored in plain text, readable by anyone with forms:read. */
	headers?: Record<string, string>;
	/** POST only; string leaves are templated. */
	body?: unknown;
	/** Path to the array in the response; empty means the response is the array. */
	itemsPath?: string;
	valuePath: string;
	labelPath: string;
	/** Present means the server filters by `{{ search }}`. */
	search?: { minChars?: number; debounceMs?: number };
	multiple?: boolean;
}
