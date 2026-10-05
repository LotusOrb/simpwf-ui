export class OAuthError extends Error {
	/** HTTP status of the failed provider call, or 0 when the failure happened in the browser. */
	public readonly status: number;
	public readonly code: string;

	constructor(status: number, code: string, message?: string) {
		super(message || code);
		this.name = 'OAuthError';
		this.status = status;
		this.code = code;
	}
}
