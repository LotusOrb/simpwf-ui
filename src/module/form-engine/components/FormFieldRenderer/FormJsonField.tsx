import React, { useState } from 'react';

import { CodeEditor } from '@common/component/CodeEditor';

interface FormJsonFieldProps {
	label: React.ReactNode;
	description?: React.ReactNode;
	required?: boolean;
	error?: React.ReactNode;
	value: unknown;
	disabled?: boolean;
	onChange: (value: unknown) => void;
}

const toText = (value: unknown) => (value === undefined ? '' : JSON.stringify(value, null, 2));

/** Raw JSON for a subtree the form can't model. Only valid JSON is committed; blank clears the value. */
export const FormJsonField: React.FC<FormJsonFieldProps> = ({
	label,
	description,
	required,
	error,
	value,
	disabled,
	onChange,
}) => {
	const [text, setText] = useState(() => toText(value));
	const [parseError, setParseError] = useState<string | null>(null);

	const change = (next: string) => {
		setText(next);
		if (!next.trim()) {
			setParseError(null);
			onChange(undefined);
			return;
		}
		try {
			onChange(JSON.parse(next));
			setParseError(null);
		} catch {
			setParseError('Not valid JSON yet; the last valid value is kept');
		}
	};

	return (
		<CodeEditor
			label={label}
			description={description}
			required={required}
			error={parseError ?? error}
			language="json"
			height={140}
			value={text}
			readOnly={disabled}
			onChange={change}
		/>
	);
};
