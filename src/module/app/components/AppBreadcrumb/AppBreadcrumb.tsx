import React from 'react';

import { Anchor, Breadcrumbs, Text } from '@mantine/core';
import { startCase } from 'es-toolkit';
import { LuHouse } from 'react-icons/lu';
import { Link, useLocation } from 'react-router';

import classes from './AppBreadcrumb.module.scss';

const HOME_PATH = '/app';

export const AppBreadcrumb: React.FC = () => {
	const { pathname } = useLocation();

	const segments = pathname
		.replace(HOME_PATH, '')
		.split('/')
		.filter(Boolean)
		.map((segment, index, all) => ({
			label: startCase(decodeURIComponent(segment)),
			to: `${HOME_PATH}/${all.slice(0, index + 1).join('/')}`,
		}));

	return (
		<Breadcrumbs separator="/" separatorMargin={6} className={classes.root}>
			<Anchor component={Link} to={HOME_PATH} aria-label="Home" className={classes.home}>
				<LuHouse size={16} />
			</Anchor>
			{segments.map((segment, index) =>
				index === segments.length - 1 ? (
					<Text key={segment.to} fz="sm" fw={600} c="dark.7">
						{segment.label}
					</Text>
				) : (
					<Anchor key={segment.to} component={Link} to={segment.to} fz="sm" c="gray.6">
						{segment.label}
					</Anchor>
				),
			)}
		</Breadcrumbs>
	);
};
