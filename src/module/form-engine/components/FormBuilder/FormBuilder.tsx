import React from 'react';

import { Badge, Text } from '@mantine/core';

import type { FormBuilderState } from '@module/form-engine/types/FormBuilderState';

import classes from './FormBuilder.module.scss';
import { FormBuilderCanvas, FormBuilderModeSwitch } from './FormBuilderCanvas';
import { FormBuilderDnd } from './FormBuilderDnd';
import { FormBuilderInspector } from './FormBuilderInspector';
import { FormBuilderIssues } from './FormBuilderIssues';
import { FormBuilderPalette } from './FormBuilderPalette';

interface FormBuilderProps {
	builder: FormBuilderState;
	readOnly?: boolean;
}

/**
 * The builder laid out inline, for hosts without the app layout's panels (e.g. a drawer). The form page places the
 * same pieces in the layout's floating panels instead.
 */
export const FormBuilder: React.FC<FormBuilderProps> = ({ builder, readOnly = false }) => {
	const building = builder.tab === 'build';
	const problems = builder.issues.length + builder.warnings.length;

	return (
		<FormBuilderDnd builder={builder}>
			<div className={classes.inline}>
				<div className={classes.inlineToolbar}>
					<FormBuilderModeSwitch builder={builder} />
				</div>
				<div className={classes.inlineBody}>
					{building && !readOnly && (
						<div className={classes.inlinePanel} data-side="left">
							<FormBuilderPalette target={builder.addTarget} onAdd={builder.add} />
						</div>
					)}
					<div className={classes.inlineCanvas}>
						<FormBuilderCanvas builder={builder} readOnly={readOnly} />
					</div>
					{building && (
						<div className={classes.inlinePanel} data-side="right">
							<FormBuilderInspector builder={builder} readOnly={readOnly} />
						</div>
					)}
				</div>
				{problems > 0 && (
					<div className={classes.inlineIssues}>
						<div className={classes.inlineIssuesHeader}>
							<Text fz={11} fw={600} c="dimmed" tt="uppercase" lts={0.4}>
								Issues
							</Text>
							<Badge size="sm" color={builder.issues.length > 0 ? 'red' : 'yellow'} variant="light">
								{problems}
							</Badge>
						</div>
						<FormBuilderIssues builder={builder} />
					</div>
				)}
			</div>
		</FormBuilderDnd>
	);
};
