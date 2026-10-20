import React from 'react';

import { Text } from '@mantine/core';

/** A field label in the inspector, matching the workflow definition inspector. */
export const SectionLabel: React.FC<{ children: React.ReactNode; required?: boolean }> = ({ children, required }) => (
	<Text fz="sm" fw={600} c="dark.6">
		{children}
		{required && (
			<Text component="span" c="red.6" inherit>
				*
			</Text>
		)}
	</Text>
);
