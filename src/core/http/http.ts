import { Axios } from 'axios';

class Http {
	private instance: Axios;

	constructor() {
		this.instance = new Axios({});
	}

	private createHeader() {}

	public request() {
		// this.instance
	}
}
