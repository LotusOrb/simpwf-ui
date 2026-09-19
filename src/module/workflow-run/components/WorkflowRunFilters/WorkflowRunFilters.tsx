import React from 'react';

import { CloseButton, Group, Select, TextInput } from '@mantine/core';
import { LuArrowUpDown, LuSearch, LuWorkflow } from 'react-icons/lu';

import type { WorkflowRunSort } from '@module/workflow-run/types/WorkflowRunSort';

import { runSortOrders } from '../../data';
import classes from './WorkflowRunFilters.module.scss';

export interface WorkflowRunFilterValues {
	search: string;
	definitionId: string | null;
	sort: WorkflowRunSort;
}

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
				aria-label="Search by run ID"
				placeholder="Search by run ID"
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
