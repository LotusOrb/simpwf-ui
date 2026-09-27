import React from 'react';

import { Text } from '@mantine/core';

import classes from './SettingsRow.module.scss';

interface SettingsRowProps {
	label: string;
	description?: string;
	children: React.ReactNode;
}

/** A setting with its label and description on the left and its control on the right. */
export const SettingsRow: React.FC<SettingsRowProps> = ({ label, description, children }) => {
	return (
		<div className={classes.root}>
			<div className={classes.text}>
				<Text fz="sm" fw={500}>
					{label}
				</Text>
				{description && (
					<Text fz="xs" c="dimmed">
						{description}
					</Text>
				)}
			</div>
			<div className={classes.control}>{children}</div>
		</div>
	);
};
