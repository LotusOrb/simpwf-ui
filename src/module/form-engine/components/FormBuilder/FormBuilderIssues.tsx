import React from 'react';

import { ScrollArea, Text } from '@mantine/core';
import { LuCircleAlert, LuCircleCheck, LuTriangleAlert } from 'react-icons/lu';

import type { FormBuilderState } from '@module/form-engine/types/FormBuilderState';

import classes from './FormBuilder.module.scss';

const MAX_HEIGHT = 200;

/** What blocks saving, then what was kept as written; the body of the bottom panel. */
export const FormBuilderIssues: React.FC<{ builder: FormBuilderState }> = ({ builder }) => {
	const { issues, warnings } = builder;

	if (issues.length === 0 && warnings.length === 0) {
		return (
			<div className={classes.ready}>
				<LuCircleCheck size={16} />
				<Text fz="sm">Ready to save</Text>
			</div>
		);
	}

	return (
		<ScrollArea.Autosize mah={MAX_HEIGHT} type="auto" scrollbars="y">
			<div className={classes.issueList}>
				{issues.map((issue) => (
					<div key={`issue-${issue}`} className={classes.issue}>
						<LuCircleAlert size={14} className={classes.issueIcon} />
						<Text fz="xs" c="dark.4">
							{issue}
						</Text>
					</div>
				))}
				{warnings.map((warning) => (
					<div key={`warning-${warning}`} className={classes.issue} data-severity="warning">
						<LuTriangleAlert size={14} className={classes.issueIcon} />
						<Text fz="xs" c="dark.4">
							{warning}
						</Text>
					</div>
				))}
			</div>
		</ScrollArea.Autosize>
	);
};
