import type * as z from 'zod';

/** zod issues keyed by dotted path (`items.0.sku`), the first message per path, as `SchemaForm`'s `errors` are. */
export const formIssuesToErrors = (issues: z.core.$ZodIssue[]): Record<string, string> => {
	const errors: Record<string, string> = {};
	for (const issue of issues) {
		const path = issue.path.map(String).join('.');
		if (!(path in errors)) errors[path] = issue.message;
	}
	return errors;
};
