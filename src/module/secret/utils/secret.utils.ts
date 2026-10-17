/** Secrets are merged into the run context under `secret`, so templates read them like env. */
export const secretReference = (key: string) => `{{ secret.${key} }}`;
