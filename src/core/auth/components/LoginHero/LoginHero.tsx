import React from 'react';

import { Box, Paper, Stack, Text, Title } from '@mantine/core';

import classes from './LoginHero.module.scss';

export const LoginHero: React.FC = () => {
	return (
		<Paper radius="lg" p={{ base: 'lg', lg: 48 }} className={classes.root}>
			<Stack h="100%" justify="center" gap="xl">
				<Box>
					<Title order={2} fz={{ base: 26, lg: 34 }} className={classes.title}>
						Effortlessly manage Simpwf
					</Title>
					<Text fz="sm" className={classes.description}>
						Log in to access your App
					</Text>
				</Box>
			</Stack>
		</Paper>
	);
};
