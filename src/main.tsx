import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { Http } from '@core/http/http.ts';

import '@mantine/core/styles.layer.css';
import '@mantine/charts/styles.layer.css';
import App from './App.tsx';

const h = new Http('');

console.log(
	h.praseComplexQueryPram({
		page: 1,
		perPage: 10,
		filter: {
			question: {
        op:"=",
        value:"Uhuy"
      },
		},
		order: {
			direction: 'asc',
			by: 'name',
		},
		search: '',
	}),
);

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
