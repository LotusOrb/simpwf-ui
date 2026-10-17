import React from 'react';

import { CloseButton, Group, Select, Switch, TextInput } from '@mantine/core';
import { LuArrowUpDown, LuBoxes, LuSearch } from 'react-icons/lu';

import { nodeDefinitionSortOrders } from '@module/node-definition/data';
import type { NodeDefinitionSort } from '@module/node-definition/types/NodeDefinitionSort';
import { nodeTypeMetaOf } from '@module/node-type/data';
import { useNodeTypeCatalog } from '@module/node-type/hooks';

export interface NodeDefinitionFilterValues {
	name: string;
	type: string | null;
	latestOnly: boolean;
	sort: NodeDefinitionSort;
}

interface NodeDefinitionFiltersProps {
	value: NodeDefinitionFilterValues;
	/** Custom node types seen in the library, offered next to the catalog's. */
	customTypes: string[];
	onChange: (value: Partial<NodeDefinitionFilterValues>) => void;
}

export const NodeDefinitionFilters: React.FC<NodeDefinitionFiltersProps> = ({ value, customTypes, onChange }) => {
	const { catalog } = useNodeTypeCatalog();
	const builtins = catalog.items.filter((item) => item.builtin).map((item) => item.type);
	const customs = [
		...new Set([...catalog.items.filter((item) => !item.builtin).map((item) => item.type), ...customTypes]),
	].sort();
	const option = (type: string) => ({ value: type, label: nodeTypeMetaOf(type, catalog.byType[type]).label });
	const typeOptions = [
		...(builtins.length > 0 ? [{ group: 'Built-in', items: builtins.map(option) }] : []),
		...(customs.length > 0 ? [{ group: 'Custom', items: customs.map(option) }] : []),
	];

	return (
		<Group gap="xs">
			<TextInput
				size="sm"
				w={220}
				aria-label="Filter by name"
				placeholder="Exact name"
				leftSection={<LuSearch size={14} />}
				value={value.name}
				onChange={(event) => onChange({ name: event.currentTarget.value })}
				rightSection={
					value.name && (
						<CloseButton size="sm" aria-label="Clear name" onClick={() => onChange({ name: '' })} />
					)
				}
			/>
			<Select
				size="sm"
				w={170}
				aria-label="Node type"
				placeholder="All types"
				clearable
				searchable
				leftSection={<LuBoxes size={14} />}
				data={typeOptions}
				value={value.type}
				onChange={(type) => onChange({ type })}
			/>
			<Select
				size="sm"
				w={160}
				aria-label="Sort by"
				allowDeselect={false}
				leftSection={<LuArrowUpDown size={14} />}
				data={Object.entries(nodeDefinitionSortOrders).map(([key, order]) => ({
					value: key,
					label: order.label,
				}))}
				value={value.sort}
				onChange={(sort) => sort && onChange({ sort: sort as NodeDefinitionSort })}
			/>
			<Switch
				label="Latest versions only"
				checked={value.latestOnly}
				onChange={(event) => onChange({ latestOnly: event.currentTarget.checked })}
			/>
		</Group>
	);
};
