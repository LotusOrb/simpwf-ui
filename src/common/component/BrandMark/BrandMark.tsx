import React from 'react';

import { Image, Text } from '@mantine/core';

import logo from '@assets/logo.jpg';

import classes from './BrandMark.module.scss';

interface BrandMarkProps {
	size?: number;
	withName?: boolean;
}

export const BrandMark: React.FC<BrandMarkProps> = ({ size = 32, withName = true }) => {
	return (
		<div className={classes.root}>
			<Image src={logo} alt="simpwf" w={size} h={size} className={classes.logo} />
			{withName && (
				<Text fz={size * 0.62} className={classes.name}>
					simpwf
				</Text>
			)}
		</div>
	);
};
