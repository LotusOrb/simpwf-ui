export class LocalKVStore {
	constructor(prefix: string | (() => string)) {
		this.prefix = typeof prefix === 'function' ? prefix() : prefix;
	}

	private readonly prefix: string;

	public set<T = unknown>(k: string, v: T): T {
		const pv = JSON.stringify(v);
		localStorage.setItem(`${this.prefix}::${k}`, pv);
		return v;
	}

	public get<T = unknown | null>(k: string): null | T {
		const item = localStorage.getItem(`${this.prefix}::${k}`);
		if (item === undefined || item === null) {
			return null;
		}
		// A corrupt or hand-edited value should read as missing rather than crash the caller.
		try {
			return JSON.parse(item) as T;
		} catch {
			return null;
		}
	}

	public delete(k: string) {
		localStorage.removeItem(`${this.prefix}::${k}`);
	}

	public clear() {
		const keyPrefix = `${this.prefix}::`;
		for (let i = localStorage.length - 1; i >= 0; i--) {
			const key = localStorage.key(i);
			if (key?.startsWith(keyPrefix)) {
				localStorage.removeItem(key);
			}
		}
	}
}

export const LocalKVStoreInstance = new LocalKVStore(() => 'STUB');
