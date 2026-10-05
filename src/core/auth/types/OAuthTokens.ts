export interface OAuthTokens {
	accessToken: string;
	refreshToken: string | null;
	idToken: string | null;
	/** Epoch milliseconds, or null when the provider did not send expires_in. */
	expiresAt: number | null;
}
