import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

const src = (dir: string) => fileURLToPath(new URL(`./src/${dir}`, import.meta.url));

// The backend sends no CORS headers, so in dev the API is proxied through the Vite origin.
const apiProxyTarget = process.env.SIMPWF_API_PROXY ?? 'http://localhost:8080';
const API_PROXY_PREFIX = '/wf-engine';

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
	server: {
		proxy: {
			[API_PROXY_PREFIX]: {
				target: apiProxyTarget,
				ws: true,
				changeOrigin: true,
				rewrite: (path) => path.slice(API_PROXY_PREFIX.length) || '/',
			},
		},
	},
	resolve: {
		alias: {
			'@config': src('config'),
			'@core': src('core'),
			'@common': src('common'),
			'@module': src('module'),
			'@assets': src('assets'),
		},
	},
});
