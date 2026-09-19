export class Config {
	private isReady = false;

	private config = {
		APP_NAME: 'Simpwf-ui',
		APP_SIMPWF_URL: 'http://localhost:9999',
	};
	//TODO: implement fetch to /config.json
	public async fetchConfigFile() {
		this.isReady = true;
	}

	public async getValue() {
		if (!this.isReady) {
			throw new Error('Config is not ready');
		}
		return this.config;
	}
}

export const config = new Config();
