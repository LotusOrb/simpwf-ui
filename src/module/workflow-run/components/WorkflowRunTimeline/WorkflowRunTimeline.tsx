import React, { useState } from 'react';

import { Badge, Group, ScrollArea, Text, Tooltip } from '@mantine/core';
import dayjs from 'dayjs';
import { LuChevronDown, LuChevronRight, LuGitBranch, LuGitFork, LuRefreshCw, LuTriangleAlert } from 'react-icons/lu';

import { nodeTypeMeta } from '@module/workflow-definition/data';
import {
	formatDuration,
	nodeRunStatusMeta,
	type WorkflowRunTimeline as Timeline,
	type WorkflowRunTimelineRow,
} from '@module/workflow-run/data';
import type { WorkflowRunNodeStatus } from '@module/workflow-run/types/WorkflowRunNodeStatus';

import classes from './WorkflowRunTimeline.module.scss';

const AXIS_TICKS = 5;
const MAX_HEIGHT = 240;
/** Gutter indent per nesting level, in px. */
const INDENT = 12;

/** Past this point a label after the bar would spill out of the track. */
const LABEL_AFTER_LIMIT = 0.85;
/** Bars at least this wide hold their own label. */
const LABEL_INSIDE_MIN_WIDTH = 0.12;

type LabelPlacement = 'after' | 'inside' | 'before';

const labelPlacement = (offset: number, width: number): LabelPlacement => {
	if (offset + width <= LABEL_AFTER_LIMIT) return 'after';
	return width >= LABEL_INSIDE_MIN_WIDTH ? 'inside' : 'before';
};

const labelStyle = (placement: LabelPlacement, offset: number, width: number): React.CSSProperties => {
	const end = offset + width;
	if (placement === 'after') return { left: `calc(${end * 100}% + 6px)` };
	if (placement === 'inside') return { right: `calc(${(1 - end) * 100}% + 6px)` };
	return { right: `calc(${(1 - offset) * 100}% + 6px)` };
};

interface TrackProps {
	gridlines: number[];
	startedAt: number;
	status: WorkflowRunNodeStatus;
	running: boolean;
	durationMs: number | null;
	offset: number;
	width: number;
	group?: boolean;
}

const Track: React.FC<TrackProps> = ({ gridlines, startedAt, status, running, durationMs, offset, width, group }) => {
	const placement = labelPlacement(offset, width);
	return (
		<div className={classes.track}>
			{gridlines.map((fraction) => (
				<span key={fraction} className={classes.gridline} style={{ left: `${fraction * 100}%` }} />
			))}
			<Tooltip
				label={
					<Group gap={6}>
						<Text fz="xs" span>
							{dayjs(startedAt).format('HH:mm:ss.SSS')}
						</Text>
						<Text fz="xs" c="dimmed" span>
							·
						</Text>
						<Text fz="xs" span>
							{nodeRunStatusMeta[status].label} · {formatDuration(durationMs)}
						</Text>
					</Group>
				}
				position="top"
				withinPortal
			>
				<span
					className={classes.bar}
					data-status={status}
					data-running={running || undefined}
					data-group={group || undefined}
					style={{ left: `${offset * 100}%`, width: `${width * 100}%` }}
				/>
			</Tooltip>
			<Text
				fz={10}
				c={placement === 'inside' && !group ? 'white' : 'dimmed'}
				className={classes.barLabel}
				style={labelStyle(placement, offset, width)}
			>
				{formatDuration(durationMs)}
			</Text>
		</div>
	);
};

interface WorkflowRunTimelineProps {
	timeline: Timeline;
	/** Entries nested under the parallel blocks and branches they ran in. */
	rows: WorkflowRunTimelineRow[];
	selectedNodeId: string | null;
	onSelect: (nodeId: string) => void;
}

export const WorkflowRunTimeline: React.FC<WorkflowRunTimelineProps> = ({
	timeline,
	rows,
	selectedNodeId,
	onSelect,
}) => {
	const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());

	if (timeline.entries.length === 0) {
		return (
			<Text fz="sm" c="dimmed" p="md">
				Nothing has executed yet.
			</Text>
		);
	}

	const toggle = (key: string) =>
		setCollapsed((current) => {
			const next = new Set(current);
			if (!next.delete(key)) next.add(key);
			return next;
		});

	const ticks = Array.from({ length: AXIS_TICKS + 1 }, (_, index) => {
		const fraction = index / AXIS_TICKS;
		return { fraction, at: timeline.startedAt + timeline.spanMs * fraction };
	});
	const gridlines = ticks.slice(1, -1).map((tick) => tick.fraction);

	const visible = rows.filter((row) => !row.ancestors.some((key) => collapsed.has(key)));

	const content = (
		<div className={classes.rows}>
			{visible.map((row) => {
				const indent = { paddingLeft: 4 + row.depth * INDENT };

				if (row.kind !== 'entry') {
					const open = !collapsed.has(row.key);
					const Chevron = open ? LuChevronDown : LuChevronRight;
					const Icon = row.kind === 'block' ? LuGitFork : LuGitBranch;
					return (
						<button
							key={row.key}
							type="button"
							className={classes.row}
							data-group={row.kind}
							aria-expanded={open}
							onClick={() => toggle(row.key)}
						>
							<div className={classes.gutter} style={indent}>
								<Chevron size={12} className={classes.rowIcon} aria-hidden />
								<Icon size={12} className={classes.groupIcon} aria-hidden />
								<Text fz="xs" fw={600} truncate title={row.label}>
									{row.label}
								</Text>
								<Badge size="xs" color="gray" variant="light" className={classes.count}>
									{row.count}
								</Badge>
							</div>
							<Track
								gridlines={gridlines}
								startedAt={row.startedAt}
								status={row.status}
								running={row.running}
								durationMs={row.endedAt - row.startedAt}
								offset={row.offset}
								width={row.width}
								group
							/>
							<div className={classes.meta} />
						</button>
					);
				}

				const { entry } = row;
				const typeMeta = nodeTypeMeta[entry.type];
				return (
					<button
						key={row.key}
						type="button"
						className={classes.row}
						data-selected={entry.nodeId === selectedNodeId || undefined}
						onClick={() => onSelect(entry.nodeId)}
					>
						<div className={classes.gutter} style={indent}>
							<typeMeta.icon size={12} className={classes.rowIcon} aria-hidden />
							<Text fz="xs" fw={500} truncate title={entry.name}>
								{entry.name}
							</Text>
							{entry.attemptCount > 1 && (
								<Tooltip label={`${entry.attemptCount} attempts`}>
									<Badge size="xs" color="orange" variant="light" className={classes.retry}>
										<LuRefreshCw size={8} /> {entry.attemptCount}
									</Badge>
								</Tooltip>
							)}
						</div>

						<Track
							gridlines={gridlines}
							startedAt={entry.startedAt}
							status={entry.status}
							running={entry.running}
							durationMs={entry.durationMs}
							offset={entry.offset}
							width={entry.width}
						/>

						<div className={classes.meta}>
							{entry.error ? (
								<Tooltip label={entry.error} multiline maw={320}>
									<span className={classes.errorIcon}>
										<LuTriangleAlert size={12} />
									</span>
								</Tooltip>
							) : null}
						</div>
					</button>
				);
			})}
		</div>
	);

	return (
		<div className={classes.root}>
			<div className={classes.axis}>
				<div className={classes.gutter} />
				<div className={classes.axisTrack}>
					{ticks.map((tick) => (
						<div key={tick.fraction} className={classes.tick} style={{ left: `${tick.fraction * 100}%` }}>
							<Text fz={10} c="dimmed" className={classes.tickLabel}>
								{dayjs(tick.at).format('HH:mm:ss')}
							</Text>
						</div>
					))}
				</div>
			</div>

			<ScrollArea.Autosize mah={MAX_HEIGHT} type="auto" scrollbars="y">
				{content}
			</ScrollArea.Autosize>
		</div>
	);
};
