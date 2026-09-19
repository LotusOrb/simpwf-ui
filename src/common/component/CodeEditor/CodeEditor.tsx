import React, { Suspense, lazy } from 'react';

import { ActionIcon, Input, Loader, Modal, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { LuMaximize2 } from 'react-icons/lu';

import classes from './CodeEditor.module.scss';
import type { CodeEditorLanguage } from './CodeEditor.types';

const CodeEditorMonaco = lazy(() => import('./CodeEditor.monaco'));

interface CodeEditorProps {
	value: string;
	onChange?: (value: string) => void;
	language?: CodeEditorLanguage;
	height?: number;
	readOnly?: boolean;
	placeholder?: string;
	label?: React.ReactNode;
	description?: React.ReactNode;
	error?: React.ReactNode;
	required?: boolean;
}

const EditorFallback: React.FC<{ height: number | string }> = ({ height }) => (
	<div className={classes.fallback} style={{ height }}>
		<Loader size="xs" color="gray" />
	</div>
);

export const CodeEditor: React.FC<CodeEditorProps> = ({
	value,
	onChange,
	language = 'javascript',
	height = 140,
	readOnly,
	placeholder,
	label,
	description,
	error,
	required,
}) => {
	const [expanded, { open, close }] = useDisclosure(false);

	// `nokey` stops canvas libraries like React Flow from treating keystrokes here as shortcuts (Space, Backspace).
	const frameClassName = `${classes.frame} nokey`;

	const editor = (editorHeight: number | string) => (
		<Suspense fallback={<EditorFallback height={editorHeight} />}>
			<CodeEditorMonaco
				value={value}
				onChange={onChange}
				language={language}
				height={editorHeight}
				readOnly={readOnly}
				placeholder={placeholder}
			/>
		</Suspense>
	);

	return (
		<Input.Wrapper
			label={label}
			description={description}
			error={error}
			required={required}
			inputWrapperOrder={['label', 'input', 'description', 'error']}
		>
			<div className={frameClassName} data-error={!!error || undefined}>
				{!expanded && editor(height)}
				<Tooltip label="Expand editor">
					<ActionIcon size="sm" className={classes.expand} aria-label="Expand editor" onClick={open}>
						<LuMaximize2 size={12} />
					</ActionIcon>
				</Tooltip>
			</div>

			<Modal opened={expanded} onClose={close} size="xl" title={label} centered>
				<div className={frameClassName} data-error={!!error || undefined}>
					{expanded && editor('60vh')}
				</div>
			</Modal>
		</Input.Wrapper>
	);
};
