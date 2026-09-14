import React from 'react';

import { Group, Pagination, Select, Text } from '@mantine/core';

import { PER_PAGE_OPTIONS } from './PaginationBar.constants';

interface PaginationBarProps {
	page: number;
	perPage: number;
	total: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	onPerPageChange: (perPage: number) => void;
	perPageOptions?: number[];
}

export const PaginationBar: React.FC<PaginationBarProps> = ({
	page,
	perPage,
	total,
	totalPages,
	onPageChange,
	onPerPageChange,
	perPageOptions = PER_PAGE_OPTIONS,
}) => {
	const rangeStart = total === 0 ? 0 : (page - 1) * perPage + 1;
	const rangeEnd = Math.min(page * perPage, total);

	return (
		<Group justify="space-between" gap="sm">
			<Group gap="xs">
				<Text fz="sm" c="dimmed">
					Per page
				</Text>
				<Select
					size="xs"
					w={72}
					aria-label="Items per page"
					allowDeselect={false}
					data={perPageOptions.map(String)}
					value={String(perPage)}
					onChange={(value) => value && onPerPageChange(Number(value))}
				/>
				<Text fz="sm" c="dimmed">
					{rangeStart}–{rangeEnd} of {total}
				</Text>
			</Group>
			{totalPages > 1 && <Pagination total={totalPages} value={page} onChange={onPageChange} size="sm" />}
		</Group>
	);
};
