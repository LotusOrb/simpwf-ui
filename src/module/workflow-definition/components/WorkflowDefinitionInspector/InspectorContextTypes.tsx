import React from 'react';

import { Group, Loader, Text, Tooltip } from '@mantine/core';
import { LuBug, LuMenu } from 'react-icons/lu';

import type { CoreQueryError } from '@core/api';

import { type EditorContextTypes, useEditorContextTypes } from '@module/workflow-definition/hooks';
import { runStatusMeta } from '@module/workflow-run/data';

import { ContextTypes } from './InspectorContextTypes.context';

/** Hands the editor-wide context source's TypeScript for `nodeId` to the script editors inside. */
export const ContextTypesProvider: React.FC<{ nodeId: string; children: React.ReactNode }> = ({ nodeId, children }) => {
	const { typescript } = useEditorContextTypes(nodeId);
	return <ContextTypes.Provider value={typescript}>{children}</ContextTypes.Provider>;
};

const describeError = ({ run, error }: EditorContextTypes) => {
	const code = (error as Partial<CoreQueryError> | undefined)?.code;
	if (run?.debug && code === 404) return "This node hasn't run in that debug run yet; step the run past it first.";
	if (run?.debug && code === 409) return 'That run is not a debug run.';
	return run ? "Couldn't load context types from that run." : "Couldn't look up the latest run.";
};

const describeRun = ({ source, run }: EditorContextTypes) => {
	if (!run) return '';
	const status = run.status ? ` · ${runStatusMeta[run.status].label}` : '';
	return `${source.mode === 'latest' ? 'latest run' : 'run'} ${run.id.slice(0, 8)}${status}`;
};

/** Read-only: which run the script editors' `context` types come from. Changed from the editor header. */
export const InspectorContextTypesStatus: React.FC<{ nodeId: string }> = ({ nodeId }) => {
	const types = useEditorContextTypes(nodeId);

	let message: string;
	switch (types.state) {
		case 'off':
			return <Hint icon={<LuMenu size={12} />}>Context types off.</Hint>;
		case 'unavailable':
			return null;
		case 'none':
			message = 'No runs of this version yet, so `context` has no types.';
			break;
		case 'loading':
			message = types.run ? `Loading types from ${describeRun(types)}…` : 'Looking up the latest run…';
			break;
		case 'error':
			return <Hint color="red">{describeError(types)}</Hint>;
		case 'ready':
			message = `Types from ${describeRun(types)}${types.run?.debug ? ', as it was at this node' : ''}.`;
			break;
	}

	return (
		<Hint
			icon={
				types.state === 'loading' ? (
					<Loader size={10} />
				) : types.run?.debug ? (
					<LuBug size={12} />
				) : (
					<LuMenu size={12} />
				)
			}
		>
			{message}
		</Hint>
	);
};

const Hint: React.FC<{ icon?: React.ReactNode; color?: string; children: React.ReactNode }> = ({
	icon,
	color = 'dimmed',
	children,
}) => (
	<Tooltip label="Change the context source from the menu in the editor header" openDelay={400}>
		<Group gap={6} wrap="nowrap" c={color}>
			{icon}
			<Text fz="xs" c={color}>
				{children}
			</Text>
		</Group>
	</Tooltip>
);
