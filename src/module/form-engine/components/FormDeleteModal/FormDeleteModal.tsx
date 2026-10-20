import React from 'react';

import { Alert, Button, Group, Modal, ScrollArea, Stack, Text } from '@mantine/core';
import { LuCircleAlert } from 'react-icons/lu';

import { FormUsageList } from '@module/form-engine/components/FormUsageList';
import type { Form } from '@module/form-engine/types/Form';

interface FormDeleteModalProps {
	form: Form | null;
	loading: boolean;
	/** Set after a 409: the form is still referenced, so the usage list replaces the confirmation. */
	inUse: boolean;
	error: string | null;
	onClose: () => void;
	onConfirm: (form: Form) => void;
}

export const FormDeleteModal: React.FC<FormDeleteModalProps> = ({
	form,
	loading,
	inUse,
	error,
	onClose,
	onConfirm,
}) => {
	return (
		<Modal
			opened={!!form}
			onClose={onClose}
			title={inUse ? 'Form is in use' : 'Delete form'}
			centered
			size={inUse ? 'lg' : 'md'}
			closeOnClickOutside={!loading}
			closeOnEscape={!loading}
			withCloseButton={!loading}
		>
			{inUse && form ? (
				<Stack gap="md">
					<Alert color="yellow" variant="light" icon={<LuCircleAlert size={16} />}>
						<Text fz="sm">
							<strong>{form.name}</strong> is still referenced by the definitions below. Remove it from
							them, or delete those definitions, then try again.
						</Text>
					</Alert>
					<ScrollArea.Autosize mah={420}>
						<FormUsageList formId={form.id} />
					</ScrollArea.Autosize>
					<Group justify="flex-end">
						<Button variant="default" onClick={onClose}>
							Close
						</Button>
					</Group>
				</Stack>
			) : (
				<Stack gap="md">
					<Text fz="sm">
						Delete <strong>{form?.name}</strong>? This cannot be undone.
					</Text>

					{error && (
						<Alert color="red" variant="light" icon={<LuCircleAlert size={16} />}>
							{error}
						</Alert>
					)}

					<Group justify="flex-end" gap="xs">
						<Button variant="default" onClick={onClose} disabled={loading}>
							Cancel
						</Button>
						<Button color="red" loading={loading} onClick={() => form && onConfirm(form)}>
							Delete
						</Button>
					</Group>
				</Stack>
			)}
		</Modal>
	);
};
