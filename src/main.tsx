import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@mantine/core/styles.layer.css';
import '@mantine/charts/styles.layer.css';
import '@mantine/dates/styles.layer.css';

import { config } from '@config/config';

import { FatalError } from '@common/component/FatalError';

import App from './App.tsx';

const root = createRoot(document.getElementById('root')!);

config
	.fetchConfigFile()
	.then(() => {
		root.render(
			<StrictMode>
				<App />
			</StrictMode>,
		);
	})
	.catch((err: unknown) => {
		root.render(
			<StrictMode>
				<FatalError title="Failed to load configuration" error={err} />
			</StrictMode>,
		);
	});
