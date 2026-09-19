export type ConfigValue = {
	SIMPWF_UI_NAME: string;
	SIMPWF_UI_API: string;
};

export class Config {
	private isReady = false;

	private pending: Promise<void> | null = null;

	private config: ConfigValue = {
		SIMPWF_UI_NAME: '',
		SIMPWF_UI_API: '',
	};

	public async fetchConfigFile() {
		if (this.isReady) return;
		this.pending ??= this.load();
		await this.pending;
	}

	public async getValue() {
		if (!this.isReady) {
			throw new Error('Config is not ready');
		}
		return this.config;
	}

	private async load() {
		try {
			const res = await fetch(`${import.meta.env.BASE_URL}config.json`, { cache: 'no-store' });
			if (!res.ok) {
				throw new Error(`Failed to fetch config.json: ${res.status}`);
			}

			const value = (await res.json()) as Partial<ConfigValue>;
			this.config = { ...this.config, ...value };
			this.isReady = true;
		} finally {
			this.pending = null;
		}
	}
}

export const config = new Config();
