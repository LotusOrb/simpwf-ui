import React from 'react';

import { ActionIcon, Burger, Group, Indicator, ScrollArea, Tooltip, UnstyledButton } from '@mantine/core';
import { LuBell } from 'react-icons/lu';

import { BrandMark } from '@common/component/BrandMark';

import { useAppHealthStatus } from '@module/app/hooks';
import type { AppHealthStatus } from '@module/app/types/AppHealthStatus';

import { AppBreadcrumb } from '../AppBreadcrumb';
import { AppProfileMenu } from '../AppProfileMenu';
import classes from './AppTopBar.module.scss';

const HEALTH_LABEL: Record<AppHealthStatus, string> = {
	checking: 'Checking Workflow Engine',
	ready: 'Connected to Workflow Engine',
	'not-ready': 'Workflow Engine not ready',
	down: 'Disconnected from Workflow Engine',
};

const HEALTH_HINT: Record<AppHealthStatus, string> = {
	checking: 'Checking engine health…',
	ready: 'Engine is live and ready. Click to recheck',
	'not-ready': 'Engine is live but its dependencies are not ready. Click to recheck',
	down: 'Engine is unreachable. Click to recheck',
};

interface AppTopBarProps {
	navOpened: boolean;
	onToggleNav: () => void;
}

export const AppTopBar: React.FC<AppTopBarProps> = ({ navOpened, onToggleNav }) => {
	const health = useAppHealthStatus();

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
				<Tooltip label={HEALTH_HINT[health.status]}>
					<UnstyledButton
						className={classes.engineStatus}
						data-status={health.status}
						disabled={health.fetching}
						onClick={health.refetch}
					>
						<span className={classes.engineDot} />
						<span className={classes.engineLabel}>{HEALTH_LABEL[health.status]}</span>
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
