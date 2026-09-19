export type ConfigValue = {
	APP_NAME: string;
	APP_SIMPWF_URL: string;
};

export class Config {
	private isReady = false;

	private pending: Promise<void> | null = null;

	private config: ConfigValue = {
		APP_NAME: 'Simpwf-ui',
		APP_SIMPWF_URL: 'http://localhost:9999',
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
		} catch (err) {
			console.error('Config fallback to default value', err);
		} finally {
			this.isReady = true;
			this.pending = null;
		}
	}
}

export const config = new Config();
