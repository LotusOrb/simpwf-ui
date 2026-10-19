import React, { useState } from 'react';

import {
	Alert,
	Badge,
	Button,
	Code,
	Divider,
	Group,
	NumberInput,
	SegmentedControl,
	Stack,
	Switch,
	Text,
	TextInput,
} from '@mantine/core';
import { set } from 'es-toolkit/compat';
import { LuCircleAlert, LuPlay, LuTriangleAlert } from 'react-icons/lu';

import { CodeEditor } from '@common/component/CodeEditor';

import { KeyValueField } from '@module/form-engine/components/SchemaForm';
import { FORM_REMOTE_DEFAULT_DEBOUNCE_MS, FORM_REMOTE_DEFAULT_MIN_CHARS } from '@module/form-engine/constant';
import type { FormDraftInputField } from '@module/form-engine/types/FormDraftField';
import type { FormRemoteOption } from '@module/form-engine/types/FormRemoteOption';
import type { FormRemoteOptions } from '@module/form-engine/types/FormRemoteOptions';
import {
	FormRemoteError,
	buildRemoteRequest,
	fetchRemote,
	mapRemoteOptions,
	remoteTokens,
} from '@module/form-engine/utils';

const RESPONSE_PREVIEW_LIMIT = 4000;

interface TestResult {
	url: string;
	response?: string;
	options?: FormRemoteOption[];
	error?: string;
	cors?: boolean;
}

interface FormBuilderRemoteEditorProps {
	field: FormDraftInputField;
	disabled?: boolean;
	onChange: (field: FormDraftInputField) => void;
}

/** Where a remote select loads options from, with a request tester that shows the raw and mapped result. */
export const FormBuilderRemoteEditor: React.FC<FormBuilderRemoteEditorProps> = ({ field, disabled, onChange }) => {
	const options: FormRemoteOptions = field.options ?? { url: '', method: 'GET', valuePath: 'id', labelPath: 'name' };
	const [bodyText, setBodyText] = useState(() =>
		options.body === undefined ? '' : JSON.stringify(options.body, null, 2),
	);
	const [bodyError, setBodyError] = useState<string | null>(null);
	const [samples, setSamples] = useState<Record<string, string>>({});
	const [testing, setTesting] = useState(false);
	const [result, setResult] = useState<TestResult | null>(null);

	const patch = (changes: Partial<FormRemoteOptions>) => onChange({ ...field, options: { ...options, ...changes } });
	const tokens = remoteTokens(options);

	const test = async () => {
		const values = {};
		const context = {};
		for (const token of tokens) {
			const sample = samples[`${token.source}:${token.path}`] ?? '';
			if (token.source === 'field') set(values, token.path.replaceAll('*', '0'), sample);
			if (token.source === 'context') set(context, token.path, sample);
		}
		const built = buildRemoteRequest(options, { values, context, search: samples['search:'] ?? '', at: '' });
		if (!built.request) {
			setResult({ url: '', error: `Fill in a sample for ${built.missing.join(', ')}` });
			return;
		}

		setTesting(true);
		const url = built.request.url;
		try {
			const response = await fetchRemote(built.request);
			const text = JSON.stringify(response, null, 2);
			const shown = text.length > RESPONSE_PREVIEW_LIMIT ? `${text.slice(0, RESPONSE_PREVIEW_LIMIT)}\n…` : text;
			try {
				setResult({ url, response: shown, options: mapRemoteOptions(response, options) });
			} catch (error) {
				setResult({ url, response: shown, error: error instanceof Error ? error.message : 'Mapping failed' });
			}
		} catch (error) {
			setResult({
				url,
				error: error instanceof Error ? error.message : 'Request failed',
				cors: error instanceof FormRemoteError && error.network,
			});
		} finally {
			setTesting(false);
		}
	};

	return (
		<Stack gap="sm">
			<Divider label="Remote options" labelPosition="left" />
			<TextInput
				size="xs"
				label="URL"
				description="May use {{ field.x }}, {{ context.x }} and {{ search }}; values are URL-encoded"
				placeholder="https://api.example.com/cities?country={{ field.country }}"
				ff="monospace"
				disabled={disabled}
				value={options.url}
				onChange={(event) => patch({ url: event.currentTarget.value })}
			/>
			<SegmentedControl
				size="xs"
				disabled={disabled}
				data={['GET', 'POST']}
				value={options.method}
				onChange={(method) => patch({ method: method as FormRemoteOptions['method'] })}
			/>
			<KeyValueField
				key={field.id}
				field={{
					path: 'headers',
					key: 'headers',
					schema: {},
					kind: 'stringMap',
					label: 'Headers',
					description: 'Templates work here too',
					required: false,
					value: options.headers,
					readOnly: !!disabled,
					onChange: (headers) => patch({ headers: headers as Record<string, string> | undefined }),
				}}
			/>
			{options.headers && Object.keys(options.headers).length > 0 && (
				<Alert color="yellow" variant="light" p={6} icon={<LuTriangleAlert size={14} />}>
					<Text fz={11}>
						Headers are stored in plain text and readable by anyone with forms:read. Don't put secrets here.
					</Text>
				</Alert>
			)}
			{options.method === 'POST' && (
				<CodeEditor
					label="Body"
					description="JSON; a string that is only a {{ token }} takes the value with its type"
					language="json"
					height={120}
					readOnly={disabled}
					value={bodyText}
					error={bodyError}
					onChange={(text) => {
						setBodyText(text);
						if (!text.trim()) {
							setBodyError(null);
							patch({ body: undefined });
							return;
						}
						try {
							patch({ body: JSON.parse(text) });
							setBodyError(null);
						} catch {
							setBodyError('Not valid JSON yet');
						}
					}}
				/>
			)}
			<TextInput
				size="xs"
				label="Items path"
				description="Where the list is in the response; blank if the response is the list"
				placeholder="data.items"
				ff="monospace"
				disabled={disabled}
				value={options.itemsPath ?? ''}
				onChange={(event) => patch({ itemsPath: event.currentTarget.value || undefined })}
			/>
			<Group grow gap={6}>
				<TextInput
					size="xs"
					label="Value path"
					placeholder="id"
					ff="monospace"
					disabled={disabled}
					value={options.valuePath}
					onChange={(event) => patch({ valuePath: event.currentTarget.value })}
				/>
				<TextInput
					size="xs"
					label="Label path"
					placeholder="name"
					ff="monospace"
					disabled={disabled}
					value={options.labelPath}
					onChange={(event) => patch({ labelPath: event.currentTarget.value })}
				/>
			</Group>
			<Switch
				size="xs"
				label="Pick several"
				disabled={disabled}
				checked={!!options.multiple}
				onChange={(event) => {
					const multiple = event.currentTarget.checked || undefined;
					onChange({ ...field, default: undefined, options: { ...options, multiple } });
				}}
			/>
			<Switch
				size="xs"
				label="Search on the server"
				description="Sends what's typed as {{ search }} instead of loading everything once"
				disabled={disabled}
				checked={!!options.search}
				onChange={(event) => patch({ search: event.currentTarget.checked ? {} : undefined })}
			/>
			{options.search && (
				<Group grow gap={6}>
					<NumberInput
						size="xs"
						label="Min characters"
						min={0}
						disabled={disabled}
						placeholder={String(FORM_REMOTE_DEFAULT_MIN_CHARS)}
						value={options.search.minChars ?? ''}
						onChange={(value) =>
							patch({
								search: { ...options.search, minChars: typeof value === 'number' ? value : undefined },
							})
						}
					/>
					<NumberInput
						size="xs"
						label="Debounce (ms)"
						min={0}
						step={50}
						disabled={disabled}
						placeholder={String(FORM_REMOTE_DEFAULT_DEBOUNCE_MS)}
						value={options.search.debounceMs ?? ''}
						onChange={(value) =>
							patch({
								search: {
									...options.search,
									debounceMs: typeof value === 'number' ? value : undefined,
								},
							})
						}
					/>
				</Group>
			)}

			<Divider label="Test request" labelPosition="left" />
			{tokens.map((token) => {
				const id = `${token.source}:${token.path}`;
				return (
					<TextInput
						key={id}
						size="xs"
						label={token.source === 'search' ? 'search' : `${token.source}.${token.path}`}
						placeholder="Sample value"
						value={samples[id] ?? ''}
						onChange={(event) => {
							const value = event.currentTarget.value;
							setSamples((current) => ({ ...current, [id]: value }));
						}}
					/>
				);
			})}
			<Group>
				<Button
					size="xs"
					variant="default"
					leftSection={<LuPlay size={12} />}
					loading={testing}
					disabled={!options.url.trim()}
					onClick={test}
				>
					Test request
				</Button>
			</Group>
			{result && (
				<Stack gap={6}>
					{result.url && (
						<Text fz={11} c="dimmed" ff="monospace" style={{ wordBreak: 'break-all' }}>
							{options.method} {result.url}
						</Text>
					)}
					{result.error && (
						<Alert color="red" variant="light" p={6} icon={<LuCircleAlert size={14} />}>
							<Text fz={11}>{result.error}</Text>
							{result.cors && (
								<Text fz={11} mt={4}>
									The browser calls the URL directly, so the server must send{' '}
									<Code fz={10}>Access-Control-Allow-Origin</Code> for this site. Nothing goes through
									the engine.
								</Text>
							)}
						</Alert>
					)}
					{result.options && (
						<Stack gap={4}>
							<Group gap={6}>
								<Text fz="xs" fw={600}>
									Options
								</Text>
								<Badge size="xs" variant="light">
									{result.options.length}
								</Badge>
							</Group>
							{result.options.slice(0, 20).map((option) => (
								<Text key={String(option.value)} fz={11}>
									{option.label}{' '}
									<Text span c="dimmed" ff="monospace" fz={11}>
										{String(option.value)}
									</Text>
								</Text>
							))}
						</Stack>
					)}
					{result.response && (
						<CodeEditor label="Response" language="json" height={160} readOnly value={result.response} />
					)}
				</Stack>
			)}
		</Stack>
	);
};
