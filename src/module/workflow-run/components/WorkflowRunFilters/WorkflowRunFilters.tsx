import React from 'react';

import { CloseButton, Group, Select, TextInput } from '@mantine/core';
import { LuArrowUpDown, LuBug, LuSearch, LuWorkflow } from 'react-icons/lu';

import type { WorkflowRunSort } from '@module/workflow-run/types/WorkflowRunSort';

import { runSortOrders } from '../../data';
import classes from './WorkflowRunFilters.module.scss';

export interface WorkflowRunFilterValues {
	search: string;
	definitionId: string | null;
	/** null = every run, true = debug runs only, false = normal runs only. */
	debug: boolean | null;
	sort: WorkflowRunSort;
}

const debugOptions = [
	{ value: 'all', label: 'All runs' },
	{ value: 'true', label: 'Debug runs' },
	{ value: 'false', label: 'Normal runs' },
];

interface WorkflowRunFiltersProps {
	value: WorkflowRunFilterValues;
	definitionOptions: { group: string; items: { value: string; label: string }[] }[];
	onChange: (value: WorkflowRunFilterValues) => void;
}

export const WorkflowRunFilters: React.FC<WorkflowRunFiltersProps> = ({ value, definitionOptions, onChange }) => {
	return (
		<Group gap="xs">
			<TextInput
				size="sm"
				w={220}
				className={classes.field}
				aria-label="Filter by run ID"
				placeholder="Paste a run ID"
				leftSection={<LuSearch size={14} />}
				value={value.search}
				onChange={(event) => onChange({ ...value, search: event.currentTarget.value })}
				rightSection={
					value.search && (
						<CloseButton
							size="sm"
							aria-label="Clear search"
							onClick={() => onChange({ ...value, search: '' })}
						/>
					)
				}
			/>
			<Select
				size="sm"
				w={230}
				className={classes.field}
				aria-label="Workflow definition"
				placeholder="All workflows"
				searchable
				clearable
				nothingFoundMessage="No workflow found"
				leftSection={<LuWorkflow size={14} />}
				data={definitionOptions}
				value={value.definitionId}
				onChange={(definitionId) => onChange({ ...value, definitionId })}
			/>
			<Select
				size="sm"
				w={160}
				className={classes.field}
				aria-label="Run kind"
				allowDeselect={false}
				leftSection={<LuBug size={14} />}
				data={debugOptions}
				value={value.debug === null ? 'all' : String(value.debug)}
				onChange={(debug) => debug && onChange({ ...value, debug: debug === 'all' ? null : debug === 'true' })}
			/>
			<Select
				size="sm"
				w={180}
				className={classes.field}
				aria-label="Sort by"
				allowDeselect={false}
				leftSection={<LuArrowUpDown size={14} />}
				data={Object.entries(runSortOrders).map(([key, order]) => ({ value: key, label: order.label }))}
				value={value.sort}
				onChange={(sort) => sort && onChange({ ...value, sort: sort as WorkflowRunSort })}
			/>
		</Group>
	);
};
