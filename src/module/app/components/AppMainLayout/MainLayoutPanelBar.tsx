import React from 'react';

import { Group, Text } from '@mantine/core';
import { LuChevronDown } from 'react-icons/lu';

import { useAppLayoutPanel } from '@module/app/hooks';
import type { AppLayoutPanelSide } from '@module/app/store';

import classes from './MainLayout.module.scss';

interface MainLayoutPanelBarProps {
	title: React.ReactNode;
	/** Shown next to the title, e.g. a count or a badge. */
	meta?: React.ReactNode;
	/** Shown at the end of the strip; clicks here don't toggle the panel. */
	actions?: React.ReactNode;
	side?: AppLayoutPanelSide;
	children: React.ReactNode;
}

/** A panel that collapses to its title strip, e.g. the bottom panel of a canvas page. */
export const MainLayoutPanelBar: React.FC<MainLayoutPanelBarProps> = ({
	title,
	meta,
	actions,
	side = 'bottom',
	children,
}) => {
	const { collapsed, toggleCollapsed } = useAppLayoutPanel();
	const isCollapsed = collapsed[side];

	return (
		<div className={classes.bar} data-collapsed={isCollapsed || undefined}>
			<div
				role="button"
				tabIndex={0}
				aria-expanded={!isCollapsed}
				className={classes.barHeader}
				onClick={() => toggleCollapsed(side)}
				onKeyDown={(event) => {
					if (event.target !== event.currentTarget || (event.key !== 'Enter' && event.key !== ' ')) return;
					event.preventDefault();
					toggleCollapsed(side);
				}}
			>
				<div className={classes.barTitle}>
					<span className={classes.barChevron}>
						<LuChevronDown size={14} />
					</span>
					<Text fz={11} fw={600} c="dimmed" tt="uppercase" lts={0.4}>
						{title}
					</Text>
					{meta}
				</div>
				{actions && (
					<Group gap={6} wrap="nowrap" onClick={(event) => event.stopPropagation()}>
						{actions}
					</Group>
				)}
			</div>
			{!isCollapsed && <div className={classes.barBody}>{children}</div>}
		</div>
	);
};
