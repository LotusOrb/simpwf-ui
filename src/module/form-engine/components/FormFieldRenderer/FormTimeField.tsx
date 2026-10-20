import React, { useRef } from 'react';

import { type TimePickerProps, TimePicker } from '@mantine/dates';

import { FORM_PICKER_TIME } from '@module/form-engine/utils';

interface FormTimeFieldProps extends Omit<TimePickerProps, 'value' | 'onChange'> {
	value: unknown;
	onChange: (value: string) => void;
}

/**
 * A 24-hour time input, the same in every locale. The picker reports nothing while a time is half typed, so on blur
 * a partial entry is kept as text that fails validation instead of passing silently as empty.
 */
export const FormTimeField: React.FC<FormTimeFieldProps> = ({ value, onChange, onBlur, ...props }) => {
	const hoursRef = useRef<HTMLInputElement>(null);
	const minutesRef = useRef<HTMLInputElement>(null);
	const complete = typeof value === 'string' && FORM_PICKER_TIME.test(value);

	const handleBlur: TimePickerProps['onBlur'] = (event) => {
		const hours = hoursRef.current?.value ?? '';
		const minutes = minutesRef.current?.value ?? '';
		if (!complete) onChange(hours || minutes ? `${hours || '--'}:${minutes || '--'}` : '');
		onBlur?.(event);
	};

	return (
		<TimePicker
			{...props}
			format="24h"
			hoursRef={hoursRef}
			minutesRef={minutesRef}
			value={complete ? value : ''}
			onChange={onChange}
			onBlur={handleBlur}
		/>
	);
};
