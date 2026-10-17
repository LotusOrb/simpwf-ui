export interface RunWatchEntry {
	/** Epoch ms; watches expire a day after this. */
	addedAt: number;
	/** Dedup key of the last status seen; null until the first snapshot sets the baseline. */
	lastKey: string | null;
	/** Shown in notifications, e.g. the definition name and version. */
	label?: string;
}
