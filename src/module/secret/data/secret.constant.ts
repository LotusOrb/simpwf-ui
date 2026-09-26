/** Mirrors the backend key rule in service/secret.go. */
export const SECRET_KEY_PATTERN = /^[A-Za-z0-9_]{1,128}$/;

export const SECRET_KEY_MAX_LENGTH = 128;

export const SECRET_VALUE_MAX_LENGTH = 8192;

/** Secrets are merged into the run context under `secret`, so templates read them like env. */
export const secretReference = (key: string) => `{{ secret.${key} }}`;
