import React, { useState } from 'react';

import { ActionIcon, Burger, Group, Indicator, ScrollArea, Tooltip, UnstyledButton } from '@mantine/core';
import { LuBell } from 'react-icons/lu';

import { BrandMark } from '@common/component/BrandMark';

import { AppBreadcrumb } from '../AppBreadcrumb';
import { AppProfileMenu } from '../AppProfileMenu';
import classes from './AppTopBar.module.scss';

interface AppTopBarProps {
	navOpened: boolean;
	onToggleNav: () => void;
}

export const AppTopBar: React.FC<AppTopBarProps> = ({ navOpened, onToggleNav }) => {
	// TODO: replace mock with real workflow engine connection status
	const [engineConnected, setEngineConnected] = useState(true);

	return (
		<Group h="100%" px="sm" gap="sm" wrap="nowrap">
			<Burger opened={navOpened} onClick={onToggleNav} hiddenFrom="sm" size="sm" />
			<Group w={48} justify="center" visibleFrom="sm">
				<BrandMark size={28} withName={false} />
			</Group>

			<ScrollArea flex={1} scrollbars="x" type="never">
				<AppBreadcrumb />
			</ScrollArea>

			<Group gap="xs" wrap="nowrap">
				<Tooltip label="Mock: click to toggle">
					<UnstyledButton
						className={classes.engineStatus}
						data-connected={engineConnected || undefined}
						onClick={() => setEngineConnected((value) => !value)}
					>
						<span className={classes.engineDot} />
						<span className={classes.engineLabel}>
							{engineConnected ? 'Connected to Workflow Engine' : 'Disconnected from Workflow Engine'}
						</span>
					</UnstyledButton>
				</Tooltip>
				<Indicator color="red" size={8} offset={7} processing>
					<Tooltip label="Notifications">
						<ActionIcon size={32} aria-label="Notifications">
							<LuBell size={18} />
						</ActionIcon>
					</Tooltip>
				</Indicator>
				<AppProfileMenu />
			</Group>
		</Group>
	);
};
