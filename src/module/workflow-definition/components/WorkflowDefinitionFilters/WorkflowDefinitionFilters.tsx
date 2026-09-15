import React from 'react';

import { Group, Select } from '@mantine/core';
import { LuArrowUpDown, LuGitBranch, LuZap } from 'react-icons/lu';

import {
	complexityMeta,
	nodeTypeMeta,
	nodeTypeOrder,
	sortOrders,
	type WorkflowComplexity,
	type WorkflowDefinitionFilterValues,
	type WorkflowDefinitionSort,
	type WorkflowNodeType,
} from '../../data';
import classes from './WorkflowDefinitionFilters.module.scss';

interface WorkflowDefinitionFiltersProps {
	value: WorkflowDefinitionFilterValues;
	onChange: (value: WorkflowDefinitionFilterValues) => void;
}

export const WorkflowDefinitionFilters: React.FC<WorkflowDefinitionFiltersProps> = ({ value, onChange }) => {
	return (
		<Group gap="xs">
			<Select
				size="sm"
				w={150}
				className={classes.select}
				aria-label="Sort by"
				leftSection={<LuArrowUpDown size={14} />}
				allowDeselect={false}
				data={Object.entries(sortOrders).map(([key, order]) => ({ value: key, label: order.label }))}
				value={value.sort}
				onChange={(sort) => sort && onChange({ ...value, sort: sort as WorkflowDefinitionSort })}
			/>
			<Select
				size="sm"
				w={160}
				className={classes.select}
				aria-label="Trigger type"
				placeholder="Trigger type"
				clearable
				leftSection={<LuZap size={14} />}
				data={nodeTypeOrder
					.filter((type) => type !== 'group')
					.map((type) => ({ value: type, label: nodeTypeMeta[type].label }))}
				value={value.startType}
				onChange={(startType) => onChange({ ...value, startType: startType as WorkflowNodeType | null })}
			/>
			<Select
				size="sm"
				w={150}
				className={classes.select}
				aria-label="Complexity"
				placeholder="Complexity"
				clearable
				leftSection={<LuGitBranch size={14} />}
				data={Object.entries(complexityMeta).map(([key, meta]) => ({ value: key, label: meta.label }))}
				value={value.complexity}
				onChange={(complexity) => onChange({ ...value, complexity: complexity as WorkflowComplexity | null })}
			/>
		</Group>
	);
};
