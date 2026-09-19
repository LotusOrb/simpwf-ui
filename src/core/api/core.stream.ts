import { config } from '@config/config';

export type CoreStreamTransport = 'ws' | 'sse';

export interface CoreStreamOptions<TMessage> {
	path: string;
	transport?: CoreStreamTransport;
	params?: Record<string, string | number | boolean | undefined | null>;
	onMessage: (message: TMessage) => void;
	onError?: (event: Event) => void;
}

export interface CoreStream {
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
					} catch {}
				});
			}),
	);

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
