const base64UrlEncode = (bytes: Uint8Array) =>
	btoa(String.fromCharCode(...bytes))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');

const base64UrlDecode = (value: string) => {
	const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
	const binary = atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '='));
	return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
};

export const randomToken = (byteLength = 32) => base64UrlEncode(crypto.getRandomValues(new Uint8Array(byteLength)));

// crypto.subtle only exists in a secure context (https or localhost), so PKCE cannot run on a plain-http host.
export const createCodeChallenge = async (verifier: string) => {
	if (!crypto.subtle) throw new Error('SSO login needs a secure context (https or localhost).');
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
	return base64UrlEncode(new Uint8Array(digest));
};

// Reads the claims only. The signature is not checked here: the token came straight from the token endpoint and the
// backend verifies every access token it receives.
export const decodeJwtPayload = (jwt: string): Record<string, unknown> | null => {
	try {
		return JSON.parse(base64UrlDecode(jwt.split('.')[1] ?? '')) as Record<string, unknown>;
	} catch {
		return null;
	}
};
