import React from 'react';

import { Menu, Stack, Tooltip, UnstyledButton } from '@mantine/core';
import { LuChevronRight } from 'react-icons/lu';
import { matchPath, NavLink, useLocation, useNavigate } from 'react-router';

import { menuConfig } from '@config/menu.config';

import type { MenuItem } from '@common/types/MenuItem';

import classes from './AppNavRail.module.scss';

const isItemActive = (item: MenuItem, pathname: string): boolean =>
	item.children?.length
		? item.children.some((child) => isItemActive(child, pathname))
		: !!item.to && !!matchPath({ path: item.to, end: false }, pathname);

const NavRailSubItems: React.FC<{ items: MenuItem[] }> = ({ items }) => {
	const navigate = useNavigate();
	const { pathname } = useLocation();

	return items.map((item) => {
		const Icon = item.icon;
		const icon = Icon && <Icon size={16} />;
		const active = isItemActive(item, pathname) || undefined;

		if (item.children?.length) {
			return (
				<Menu.Sub key={item.id} position="right-start" offset={4}>
					<Menu.Sub.Target>
						<Menu.Sub.Item leftSection={icon} data-active={active} className={classes.subItem}>
							{item.label}
						</Menu.Sub.Item>
					</Menu.Sub.Target>
					<Menu.Sub.Dropdown>
						<NavRailSubItems items={item.children} />
					</Menu.Sub.Dropdown>
				</Menu.Sub>
			);
		}

		return (
			<Menu.Item
				key={item.id}
				leftSection={icon}
				data-active={active}
				className={classes.subItem}
				onClick={() => item.to && navigate(item.to)}
			>
				{item.label}
			</Menu.Item>
		);
	});
};

const NavRailButton: React.FC<{ item: MenuItem }> = ({ item }) => {
	const { pathname } = useLocation();
	const Icon = item.icon;
	const content = Icon ? <Icon size={20} strokeWidth={1.75} /> : item.label.charAt(0);

	if (item.children?.length) {
		return (
			<Menu trigger="click-hover" position="right-start" offset={12} openDelay={80} closeDelay={150} withinPortal>
				<Menu.Target>
					<UnstyledButton
						aria-label={item.label}
						className={classes.item}
						data-active={isItemActive(item, pathname) || undefined}
					>
						{content}
						<LuChevronRight size={10} className={classes.caret} aria-hidden />
					</UnstyledButton>
				</Menu.Target>
				<Menu.Dropdown miw={200}>
					<Menu.Label>{item.label}</Menu.Label>
					<NavRailSubItems items={item.children} />
				</Menu.Dropdown>
			</Menu>
		);
	}

	return (
		<Tooltip label={item.label} position="right">
			<NavLink to={item.to ?? '#'} aria-label={item.label} className={classes.item}>
				{content}
			</NavLink>
		</Tooltip>
	);
};

export const AppNavRail: React.FC = () => {
	return (
		<Stack justify="space-between" align="center" h="100%" py="sm">
			<Stack gap={6} align="center">
				{menuConfig.top.map((item) => (
					<NavRailButton key={item.id} item={item} />
				))}
			</Stack>
			<Stack gap={6} align="center">
				{menuConfig.bottom.map((item) => (
					<NavRailButton key={item.id} item={item} />
				))}
			</Stack>
		</Stack>
	);
};
