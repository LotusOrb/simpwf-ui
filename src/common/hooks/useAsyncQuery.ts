import { useEffect, useEffectEvent, useState } from 'react';

export const useAsyncQuery = <TQuery, TData>(fetcher: (query: TQuery) => Promise<TData>, query: TQuery) => {
	const [version, setVersion] = useState(0);
	const [response, setResponse] = useState<{ queryKey: string; requestKey: string; data: TData } | null>(null);

	const queryKey = JSON.stringify(query);
	const requestKey = `${version}:${queryKey}`;
	const runFetcher = useEffectEvent((currentQuery: TQuery) => fetcher(currentQuery));

	useEffect(() => {
		let ignore = false;

		runFetcher(JSON.parse(queryKey)).then((data) => {
			if (!ignore) setResponse({ queryKey, requestKey, data });
		});

		return () => {
			ignore = true;
		};
	}, [queryKey, requestKey]);

	return {
		data: response?.data ?? null,
		loading: response?.queryKey !== queryKey,
		fetching: response?.requestKey !== requestKey,
		refetch: () => setVersion((current) => current + 1),
	};
};
