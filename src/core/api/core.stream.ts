import { config } from '@config/config';

export type CoreStreamTransport = 'ws' | 'sse';

export interface CoreStreamOptions<TMessage> {
	/** Path appended to the API origin, e.g. `/workflow-runs/stream`. */
	path: string;
	transport?: CoreStreamTransport;
	/** Serialized onto the connect URL as a query string. */
	params?: Record<string, string | number | boolean | undefined | null>;
	onMessage: (message: TMessage) => void;
	onError?: (event: Event) => void;
}

export interface CoreStream {
	/** Resolves once the socket is open; rejects if it never opens. */
	opened: Promise<void>;
	close: () => void;
}

const buildUrl = (origin: string, options: CoreStreamOptions<unknown>) => {
	const url = new URL(options.path, origin);

	for (const [key, value] of Object.entries(options.params ?? {})) {
		if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
	}

	if ((options.transport ?? 'ws') === 'ws') {
		url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
	}

	return url.toString();
};

/**
 * Transport-agnostic live feed, used from `onCacheEntryAdded`.
 *
 * The backend contract is not settled yet, so both transports are here and the
 * call sites only pick a string. Swapping `'ws'` for `'sse'` changes nothing
 * above this function.
 */
export const openCoreStream = <TMessage>(options: CoreStreamOptions<TMessage>): CoreStream => {
	const transport = options.transport ?? 'ws';
	let socket: WebSocket | EventSource | null = null;
	let closed = false;

	const opened = config.getValue().then(
		(value) =>
			new Promise<void>((resolve, reject) => {
				if (closed) return resolve();

				const url = buildUrl(value.APP_SIMPWF_URL, options as CoreStreamOptions<unknown>);
				socket = transport === 'ws' ? new WebSocket(url) : new EventSource(url);

				socket.addEventListener('open', () => resolve());
				socket.addEventListener('error', (event) => {
					options.onError?.(event);
					reject(event);
				});
				socket.addEventListener('message', (event) => {
					const data = (event as MessageEvent<string>).data;
					try {
						options.onMessage(JSON.parse(data) as TMessage);
					} catch {
						// A frame we cannot parse is dropped rather than tearing down the feed.
					}
				});
			}),
	);

	// Nobody awaits `opened` on the teardown path; swallow so it never surfaces
	// as an unhandled rejection.
	opened.catch(() => {});

	return {
		opened,
		close: () => {
			closed = true;
			socket?.close();
			socket = null;
		},
	};
};
