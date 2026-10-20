/** Parses the raw payload box: blank sends `{}`. Null when the text isn't JSON. */
export const parseRawPayload = (raw: string): { payload: unknown } | null => {
	try {
		return { payload: raw.trim() ? JSON.parse(raw) : {} };
	} catch {
		return null;
	}
};
