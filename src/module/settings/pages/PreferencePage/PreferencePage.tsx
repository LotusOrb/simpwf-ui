import React, { Fragment, useEffect } from 'react';

import { Button, Divider, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';

import { useCoreDispatch, useCoreSelector } from '@core/store';

import { ViewModeToggle } from '@common/component/ViewModeToggle';

import { SettingsRow } from '@module/settings/components/SettingsRow';
import { LIST_VIEW_OPTIONS } from '@module/settings/data';
import { listViewSaved, selectListView } from '@module/settings/store';
import type { ListViewPreference } from '@module/settings/types/ListViewPreference';

export const PreferencePage: React.FC = () => {
	const dispatch = useCoreDispatch();
	const saved = useCoreSelector(selectListView);
	const form = useForm<ListViewPreference>({ initialValues: saved });
	const dirty = form.isDirty();

	// Follow changes made elsewhere (e.g. a list page toggle) unless the user has unsaved edits.
	useEffect(() => {
		if (!form.isDirty()) {
			form.setValues(saved);
			form.resetDirty(saved);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [saved]);

	const handleSubmit = (values: ListViewPreference) => {
		dispatch(listViewSaved(values));
		form.resetDirty(values);
		notifications.show({ message: 'Preferences saved' });
	};

	return (
		<Paper component="form" withBorder radius="md" p="lg" onSubmit={form.onSubmit(handleSubmit)}>
			<Stack gap="md">
				<div>
					<Title order={3} fz="md">
						List view
					</Title>
					<Text c="dimmed" fz="sm">
						Choose the default layout for each list. Changing the toggle on a list page updates this too.
					</Text>
				</div>
				<div>
					{LIST_VIEW_OPTIONS.map((option, index) => (
						<Fragment key={option.key}>
							{index > 0 && <Divider />}
							<SettingsRow label={option.label} description={option.description}>
								<ViewModeToggle
									value={form.values[option.key]}
									onChange={(view) => form.setFieldValue(option.key, view)}
								/>
							</SettingsRow>
						</Fragment>
					))}
				</div>
				<Group justify="flex-end" gap="sm">
					<Button variant="default" disabled={!dirty} onClick={() => form.reset()}>
						Reset
					</Button>
					<Button type="submit" disabled={!dirty}>
						Save
					</Button>
				</Group>
			</Stack>
		</Paper>
	);
};
