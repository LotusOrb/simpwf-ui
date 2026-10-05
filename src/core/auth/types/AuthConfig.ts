export interface AuthConfig {
	enabled: boolean;
	api_token_enabled: boolean;
	issuer: string;
	client_id: string;
	audience: string;
	authorization_url: string;
	token_url: string;
	roles_claim: string;
	scopes: string[];
	roles: string[];
}
