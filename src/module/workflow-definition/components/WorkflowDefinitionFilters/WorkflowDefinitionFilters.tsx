import React from 'react';

import { Group, Select } from '@mantine/core';
import { LuArrowUpDown } from 'react-icons/lu';

import { sortOrders } from '@module/workflow-definition/constant';
import type { WorkflowDefinitionFilterValues } from '@module/workflow-definition/types/WorkflowDefinitionFilterValues';
import type { WorkflowDefinitionSort } from '@module/workflow-definition/types/WorkflowDefinitionSort';

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
		</Group>
	);
};
