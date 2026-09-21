import React from 'react';

import { Badge, Group, ScrollArea, Text, Tooltip } from '@mantine/core';
import dayjs from 'dayjs';
import { LuRefreshCw, LuTriangleAlert } from 'react-icons/lu';

import { nodeTypeMeta } from '@module/workflow-definition/data';
import { formatDuration, nodeRunStatusMeta, type WorkflowRunTimeline as Timeline } from '@module/workflow-run/data';

import classes from './WorkflowRunTimeline.module.scss';

const AXIS_TICKS = 5;

interface WorkflowRunTimelineProps {
	timeline: Timeline;
	selectedNodeId: string | null;
	onSelect: (nodeId: string) => void;
}

export const WorkflowRunTimeline: React.FC<WorkflowRunTimelineProps> = ({ timeline, selectedNodeId, onSelect }) => {
	if (timeline.entries.length === 0) {
		return (
			<Text fz="sm" c="dimmed" p="md">
				Nothing has executed yet.
			</Text>
		);
	}

	const ticks = Array.from({ length: AXIS_TICKS + 1 }, (_, index) => {
		const fraction = index / AXIS_TICKS;
		return { fraction, at: timeline.startedAt + timeline.spanMs * fraction };
	});

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

			<ScrollArea.Autosize mah={220} type="auto">
				<div className={classes.rows}>
					{timeline.entries.map((entry) => {
						const statusMeta = nodeRunStatusMeta[entry.status];
						const typeMeta = nodeTypeMeta[entry.type];

						return (
							<button
								key={entry.occurrenceId}
								type="button"
								className={classes.row}
								data-selected={entry.nodeId === selectedNodeId || undefined}
								onClick={() => onSelect(entry.nodeId)}
							>
								<div className={classes.gutter}>
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

								<div className={classes.track}>
									{ticks.slice(1, -1).map((tick) => (
										<span
											key={tick.fraction}
											className={classes.gridline}
											style={{ left: `${tick.fraction * 100}%` }}
										/>
									))}
									<Tooltip
										label={
											<Group gap={6}>
												<Text fz="xs" span>
													{dayjs(entry.startedAt).format('HH:mm:ss.SSS')}
												</Text>
												<Text fz="xs" c="dimmed" span>
													·
												</Text>
												<Text fz="xs" span>
													{statusMeta.label} · {formatDuration(entry.durationMs)}
												</Text>
											</Group>
										}
										position="top"
										withinPortal
									>
										<span
											className={classes.bar}
											data-status={entry.status}
											data-running={entry.running || undefined}
											style={{
												left: `${entry.offset * 100}%`,
												width: `${entry.width * 100}%`,
											}}
										/>
									</Tooltip>
									<Text
										fz={10}
										c="dimmed"
										className={classes.barLabel}
										style={{ left: `calc(${(entry.offset + entry.width) * 100}% + 6px)` }}
									>
										{formatDuration(entry.durationMs)}
									</Text>
								</div>

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
			</ScrollArea.Autosize>
		</div>
	);
};
