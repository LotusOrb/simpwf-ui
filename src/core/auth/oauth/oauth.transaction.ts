export interface OAuthTransaction {
	state: string;
	codeVerifier: string;
	nonce: string;
	redirectUri: string;
	returnTo: string;
}

// sessionStorage survives the round trip to the provider but stays scoped to the tab that started the login.
const KEY_PREFIX = 'oauth::tx::';

export const saveOAuthTransaction = (tx: OAuthTransaction) => {
	sessionStorage.setItem(`${KEY_PREFIX}${tx.state}`, JSON.stringify(tx));
};

// A transaction is single-use: it is removed as it is read, so a replayed callback URL finds nothing.
export const takeOAuthTransaction = (state: string): OAuthTransaction | null => {
	const key = `${KEY_PREFIX}${state}`;
	const raw = sessionStorage.getItem(key);
	sessionStorage.removeItem(key);
	if (!raw) return null;

	try {
		return JSON.parse(raw) as OAuthTransaction;
	} catch {
		return null;
	}
};
