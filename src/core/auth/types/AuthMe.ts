export interface AuthMe {
	id: string;
	subject: string;
	name: string;
	email: string;
	roles: string[];
	permissions: string[];
	service: boolean;
}
