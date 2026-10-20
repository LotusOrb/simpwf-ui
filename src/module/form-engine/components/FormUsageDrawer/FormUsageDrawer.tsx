import React from 'react';

import { Drawer, Text } from '@mantine/core';

import { FormUsageList } from '@module/form-engine/components/FormUsageList';
import type { Form } from '@module/form-engine/types/Form';

interface FormUsageDrawerProps {
	form: Pick<Form, 'id' | 'name'> | null;
	onClose: () => void;
}

export const FormUsageDrawer: React.FC<FormUsageDrawerProps> = ({ form, onClose }) => {
	return (
		<Drawer
			opened={!!form}
			onClose={onClose}
			position="right"
			size="md"
			title={
				<div>
					<Text fw={600}>Where it's used</Text>
					<Text fz="xs" c="dimmed">
						{form?.name}
					</Text>
				</div>
			}
		>
			{form && <FormUsageList formId={form.id} />}
		</Drawer>
	);
};
