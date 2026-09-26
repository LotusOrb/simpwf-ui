import * as z from 'zod';

import { SECRET_KEY_MAX_LENGTH, SECRET_KEY_PATTERN, SECRET_VALUE_MAX_LENGTH } from '../data';

export const secretSchema = z.object({
	key: z
		.string()
		.min(1, 'Enter a key')
		.max(SECRET_KEY_MAX_LENGTH, `Key must be at most ${SECRET_KEY_MAX_LENGTH} characters`)
		.regex(SECRET_KEY_PATTERN, 'Use letters, numbers and underscores only'),
	value: z
		.string()
		.min(1, 'Enter a value')
		.max(SECRET_VALUE_MAX_LENGTH, `Value must be at most ${SECRET_VALUE_MAX_LENGTH} characters`),
});

export type SecretDto = z.infer<typeof secretSchema>;

export const secretInitialValues: SecretDto = {
	key: '',
	value: '',
};
