import React, { useEffect, useRef } from 'react';

import { Anchor, Loader, MultiSelect, type OptionsFilter, Select, Text } from '@mantine/core';

import { useRemoteOptions } from '@module/form-engine/hooks';
import type { FormEngine } from '@module/form-engine/types/FormEngine';
import type { FormFieldModel } from '@module/form-engine/types/FormFieldModel';
import type { FormRemoteOptions } from '@module/form-engine/types/FormRemoteOptions';
import { walkFormModel } from '@module/form-engine/utils';

/** The server already filtered a searchable source, so nothing is filtered again here. */
const passThrough: OptionsFilter<string> = ({ options }) => options;

/** The label a value had in any response loaded so far, so an earlier pick keeps its name. */
const knownLabel = (engine: FormEngine, key: string) => {
	for (const list of engine.remoteCache.values()) {
		const hit = list.find((item) => String(item.value) === key);
		if (hit) return hit.label;
	}
	return key;
};

interface FormRemoteSelectFieldProps {
	engine: FormEngine;
	field: FormFieldModel;
	options: FormRemoteOptions;
	path: string;
	value: unknown;
	error?: React.ReactNode;
	disabled?: boolean;
	onChange: (value: unknown) => void;
}

/** "Select Country first" for a missing field token, a plain note for a missing context value. */
const waitingFor = (engine: FormEngine, missing: string[]) => {
	const [first] = missing;
	if (!first) return null;
	if (first.startsWith('field.')) {
		const uiPath = first.slice('field.'.length);
		const target = walkFormModel(engine.model.fields).find((item) => item.uiPath === uiPath);
		return `Select ${target?.label ?? uiPath} first`;
	}
	return `Needs ${first} from the run, which isn't set yet`;
};

/** A select whose options come from a third-party request; see `FormRemoteOptions`. */
export const FormRemoteSelectField: React.FC<FormRemoteSelectFieldProps> = ({
	engine,
	field,
	options,
	path,
	value,
	error,
	disabled,
	onChange,
}) => {
	const remote = useRemoteOptions(engine, options, path);

	const multiple = !!options.multiple;
	const selected = (
		multiple ? (Array.isArray(value) ? value : []) : value === null || value === undefined ? [] : [value]
	).map(String);
	const byKey = new Map(remote.items.map((item) => [String(item.value), item.value]));
	// Picks stay listed even when the current results (a new search) don't include them.
	const data = [
		...remote.items.map((item) => ({ value: String(item.value), label: item.label })),
		...selected.filter((key) => !byKey.has(key)).map((key) => ({ value: key, label: knownLabel(engine, key) })),
	];
	const toValue = (key: string) => byKey.get(key) ?? key;

	// When a field this select reads changes, earlier picks may not exist any more.
	const lastDependency = useRef(remote.dependencyKey);
	const recheck = useRef(false);
	useEffect(() => {
		if (lastDependency.current === remote.dependencyKey) return;
		lastDependency.current = remote.dependencyKey;
		if (remote.searchable) onChange(multiple ? [] : null);
		else recheck.current = true;
	}, [remote.dependencyKey, remote.searchable, multiple, onChange]);
	useEffect(() => {
		if (!recheck.current || remote.loading || remote.missing.length) return;
		recheck.current = false;
		const kept = selected.filter((key) => byKey.has(key));
		if (kept.length !== selected.length) onChange(multiple ? kept.map(toValue) : null);
	});

	const waiting = waitingFor(engine, remote.missing);
	const note = remote.error ? (
		<Text span fz="xs" c="red">
			{remote.error}{' '}
			<Anchor component="button" type="button" fz="xs" onClick={remote.retry}>
				Retry
			</Anchor>
		</Text>
	) : (
		waiting
	);

	const common = {
		label: field.label,
		description: [field.help, note].some(Boolean) ? (
			<>
				{field.help}
				{field.help && note ? ' · ' : null}
				{note}
			</>
		) : undefined,
		withAsterisk: field.required,
		error,
		placeholder: field.placeholder || (remote.searchable ? 'Type to search' : undefined),
		disabled: disabled || !!waiting,
		data,
		searchable: true,
		rightSection: remote.loading ? <Loader size={14} /> : undefined,
		nothingFoundMessage: remote.loading
			? 'Loading…'
			: remote.tooShort
				? `Type at least ${options.search?.minChars ?? 1} characters`
				: 'Nothing found',
		inputWrapperOrder: ['label', 'input', 'description', 'error'] as (
			| 'label'
			| 'input'
			| 'description'
			| 'error'
		)[],
		// The server filters a searchable source; anything else is filtered here.
		...(remote.searchable
			? { searchValue: remote.search, onSearchChange: remote.setSearch, filter: passThrough }
			: {}),
	};

	return multiple ? (
		<MultiSelect {...common} clearable value={selected} onChange={(keys) => onChange(keys.map(toValue))} />
	) : (
		<Select
			{...common}
			clearable={!field.required}
			value={selected[0] ?? null}
			onChange={(key) => onChange(key === null ? null : toValue(key))}
		/>
	);
};
