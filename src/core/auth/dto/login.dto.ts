import * as z from 'zod';

export const loginSchema = z.object({
	apiKey: z.string().min(1, 'Enter your API key'),
});

export type LoginDto = z.infer<typeof loginSchema>;

export const loginInitialValues: LoginDto = {
	apiKey: '',
};
