import React, { useState } from 'react';

import {
	Anchor,
	Button,
	Card,
	Checkbox,
	Divider,
	Group,
	Progress,
	ScrollArea,
	SegmentedControl,
	Select,
	Stack,
	Switch,
	Text,
	Textarea,
	TextInput,
} from '@mantine/core';
import { LuChevronsUpDown } from 'react-icons/lu';

import { storageUsage } from '../../data';
import classes from './DashboardSettingsPanel.module.scss';

type PanelTab = 'setup' | 'configure' | 'test';

const serverOptions = ['US-East', 'US-West', 'EU-Central', 'AP-Southeast'];

const notificationOptions = [
	{ id: 'system', label: 'System', defaultChecked: false },
	{ id: 'procedural', label: 'Procedural', defaultChecked: true },
	{ id: 'tickets', label: 'New tickets', defaultChecked: false },
	{ id: 'storage', label: 'Storage', defaultChecked: true },
];

const SectionLabel: React.FC<{ children: React.ReactNode; required?: boolean }> = ({ children, required }) => (
	<Text fz="sm" fw={600} c="dark.6">
		{children}
		{required && (
			<Text component="span" c="red.6" inherit>
				*
			</Text>
		)}
	</Text>
);

export const DashboardSettingsPanel: React.FC = () => {
	const [tab, setTab] = useState<PanelTab>('configure');
	const usedPercent = (storageUsage.usedGb / storageUsage.totalGb) * 100;

	return (
		<div className={classes.root}>
			<div className={classes.header}>
				<SegmentedControl
					value={tab}
					onChange={(value) => setTab(value as PanelTab)}
					classNames={{ root: classes.segmented, indicator: classes.indicator, label: classes.segmentLabel }}
					data={[
						{ label: 'Setup', value: 'setup' },
						{ label: 'Configure', value: 'configure' },
						{ label: 'Test', value: 'test' },
					]}
				/>
			</div>

			<ScrollArea flex={1} type="hover">
				<Stack gap="lg" p="md">
					{tab === 'setup' && (
						<>
							<TextInput label="Workspace name" defaultValue="Overview" />
							<Textarea
								label="Description"
								autosize
								minRows={3}
								placeholder="What is this workspace for?"
							/>
						</>
					)}

					{tab === 'configure' && (
						<>
							<Stack gap="sm">
								<SectionLabel>Notification</SectionLabel>
								{notificationOptions.map((option) => (
									<Group key={option.id} justify="space-between">
										<Text fz="sm" c="dark.5">
											{option.label}
										</Text>
										<Switch
											aria-label={`${option.label} notifications`}
											defaultChecked={option.defaultChecked}
										/>
									</Group>
								))}
							</Stack>

							<Select
								label={<SectionLabel required>Servers</SectionLabel>}
								description="Ensure server location is correctly set to match your region for optimal performance"
								inputWrapperOrder={['label', 'input', 'description']}
								data={serverOptions}
								defaultValue="US-East"
								rightSection={<LuChevronsUpDown size={14} />}
								allowDeselect={false}
							/>

							<Select
								label={<SectionLabel>Backup Server</SectionLabel>}
								data={serverOptions}
								defaultValue="EU-Central"
								rightSection={<LuChevronsUpDown size={14} />}
								allowDeselect={false}
							/>

							<Group justify="space-between" wrap="nowrap" align="flex-start">
								<div>
									<SectionLabel>Automatic Switch</SectionLabel>
									<Text fz="xs" c="dimmed">
										Switch automatically to backup servers if the main server is down
									</Text>
								</div>
								<Switch aria-label="Automatic switch" defaultChecked />
							</Group>

							<Stack gap="xs">
								<Group justify="space-between">
									<SectionLabel>Storage</SectionLabel>
									<Anchor component="button" type="button" fz="sm" fw={500}>
										Upgrade
									</Anchor>
								</Group>
								<Card shadow="none" padding="sm">
									<Group grow>
										<div className={classes.metric}>
											<Text fw={600}>{storageUsage.uploadedGb} GB</Text>
											<Text fz="xs" c="dimmed">
												Uploaded
											</Text>
										</div>
										<div className={classes.metric}>
											<Text fw={600}>{storageUsage.reservedGb} GB</Text>
											<Text fz="xs" c="dimmed">
												Reserved
											</Text>
										</div>
									</Group>
									<Divider my="sm" />
									<Text fw={600}>{storageUsage.usedGb} GB</Text>
									<Text fz="xs" c="dimmed" mb={6}>
										Used from {storageUsage.totalGb} GB
									</Text>
									<Progress
										value={usedPercent}
										size="md"
										radius="xl"
										aria-label={`${Math.round(usedPercent)}% of storage used`}
									/>
								</Card>
							</Stack>

							<Stack gap="xs">
								<SectionLabel required>Error Handling</SectionLabel>
								<Checkbox
									label="Enable Automatic Retry"
									description="Automatically retries the process if an error occurs"
									radius="xl"
								/>
							</Stack>
						</>
					)}

					{tab === 'test' && (
						<Stack gap="xs">
							<SectionLabel>Test run</SectionLabel>
							<Text fz="sm" c="dimmed">
								Trigger every active workflow once with sample data to verify servers and integrations.
							</Text>
						</Stack>
					)}
				</Stack>
			</ScrollArea>

			<div className={classes.footer}>
				<Button fullWidth size="md">
					Save &amp; Test
				</Button>
			</div>
		</div>
	);
};
