import React from 'react';

import { Center, SegmentedControl, Tooltip, VisuallyHidden } from '@mantine/core';
import { LuLayoutGrid, LuList } from 'react-icons/lu';

import classes from './ViewModeToggle.module.scss';

export type ViewMode = 'card' | 'list';

interface ViewModeToggleProps {
	value: ViewMode;
	onChange: (value: ViewMode) => void;
}

const options = [
	{ value: 'card', label: 'Card view', icon: LuLayoutGrid },
	{ value: 'list', label: 'List view', icon: LuList },
] as const;

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ value, onChange }) => {
	return (
		<SegmentedControl
			fullWidth={false}
			size="xs"
			className={classes.root}
			value={value}
			onChange={(next) => onChange(next as ViewMode)}
			data={options.map((option) => ({
				value: option.value,
				label: (
					<Tooltip label={option.label}>
						<Center className={classes.icon}>
							<option.icon size={15} aria-hidden />
							<VisuallyHidden>{option.label}</VisuallyHidden>
						</Center>
					</Tooltip>
				),
			}))}
		/>
	);
};
