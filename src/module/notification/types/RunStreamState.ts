/** `done` and `failed` streams stay closed until the run stops being watched or viewed. */
export type RunStreamState = 'connecting' | 'open' | 'reconnecting' | 'done' | 'failed';
