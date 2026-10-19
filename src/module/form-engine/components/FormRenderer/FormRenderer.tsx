import React, { useEffect, useState } from 'react';

import { Accordion, Alert, Badge, Button, Fieldset, Group, Stack, Stepper, Text } from '@mantine/core';
import { LuArrowLeft, LuArrowRight, LuCircleAlert } from 'react-icons/lu';

import { FormFieldGrid } from '@module/form-engine/components/FormFieldRenderer';
import type { FormEngine } from '@module/form-engine/types/FormEngine';
import type { FormFieldModel } from '@module/form-engine/types/FormFieldModel';
import type { FormSection } from '@module/form-engine/types/FormSection';
import { isPathUnder } from '@module/form-engine/utils';

interface FormRendererProps {
	engine: FormEngine;
	disabled?: boolean;
}

interface SectionView {
	section: FormSection;
	fields: FormFieldModel[];
}

interface SectionsProps {
	engine: FormEngine;
	sections: SectionView[];
	disabled?: boolean;
}

/** How many of the form's current errors fall in `view`. */
const errorCount = (engine: FormEngine, view: SectionView) => {
	const keys = view.fields.map((field) => field.key);
	return Object.keys(engine.form.errors).filter((path) => isPathUnder(path, keys)).length;
};

const SectionBody: React.FC<{ engine: FormEngine; view: SectionView; disabled?: boolean }> = ({
	engine,
	view,
	disabled,
}) => (
	<Stack gap="sm">
		{view.section.description && (
			<Text fz="xs" c="dimmed">
				{view.section.description}
			</Text>
		)}
		<FormFieldGrid engine={engine} fields={view.fields} prefix="" disabled={disabled} />
	</Stack>
);

const LongSections: React.FC<SectionsProps> = ({ engine, sections, disabled }) =>
	sections.map((view) => (
		<Fieldset
			key={view.section.id}
			legend={
				<Text span fw={600}>
					{view.section.title}
				</Text>
			}
		>
			<SectionBody engine={engine} view={view} disabled={disabled} />
		</Fieldset>
	));

/** One section at a time, driven by `engine.step`; Next validates only the current step's fields. */
const StepperSections: React.FC<SectionsProps> = ({ engine, sections, disabled }) => {
	const { step } = engine;
	const current = sections[Math.min(step.index, sections.length - 1)];

	return (
		<Stack gap="md">
			<Stepper active={step.index} onStepClick={step.go} allowNextStepsSelect={false} size="sm">
				{sections.map((view) => (
					<Stepper.Step
						key={view.section.id}
						label={view.section.title}
						color={errorCount(engine, view) ? 'red' : undefined}
					/>
				))}
			</Stepper>
			<SectionBody engine={engine} view={current} disabled={disabled} />
			<Group justify="space-between">
				<Button
					size="xs"
					variant="default"
					leftSection={<LuArrowLeft size={14} />}
					disabled={step.index === 0}
					onClick={() => step.go(step.index - 1)}
				>
					Back
				</Button>
				{!step.isLast && (
					<Button size="xs" rightSection={<LuArrowRight size={14} />} disabled={disabled} onClick={step.next}>
						Next
					</Button>
				)}
			</Group>
		</Stack>
	);
};

/** Collapsible sections; ones with errors open themselves. */
const AccordionSections: React.FC<SectionsProps> = ({ engine, sections, disabled }) => {
	const [open, setOpen] = useState<string[]>(() => sections.slice(0, 1).map((view) => view.section.id));

	useEffect(() => {
		const failing = sections.filter((view) => errorCount(engine, view) > 0).map((view) => view.section.id);
		if (failing.length) setOpen((current) => [...new Set([...current, ...failing])]);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [engine.form.errors]);

	return (
		<Accordion multiple variant="separated" value={open} onChange={setOpen}>
			{sections.map((view) => {
				const errors = errorCount(engine, view);
				return (
					<Accordion.Item key={view.section.id} value={view.section.id}>
						<Accordion.Control>
							<Group gap="xs">
								<Text fw={600} fz="sm">
									{view.section.title}
								</Text>
								{errors > 0 && (
									<Badge size="xs" color="red" variant="light">
										{errors} {errors === 1 ? 'error' : 'errors'}
									</Badge>
								)}
							</Group>
						</Accordion.Control>
						<Accordion.Panel>
							<SectionBody engine={engine} view={view} disabled={disabled} />
						</Accordion.Panel>
					</Accordion.Item>
				);
			})}
		</Accordion>
	);
};

const SECTION_LAYOUTS = {
	long: LongSections,
	stepper: StepperSections,
	accordion: AccordionSections,
} satisfies Record<FormEngine['model']['sectionStyle'], React.FC<SectionsProps>>;

/** A form for people to fill: ungrouped fields first, then the sections in the form's section style. */
export const FormRenderer: React.FC<FormRendererProps> = ({ engine, disabled }) => {
	const { model, form } = engine;
	const byKey = new Map(model.fields.map((field) => [field.key, field]));
	const ungrouped = model.ungrouped.flatMap((key) => byKey.get(key) ?? []);
	const sections = model.sections
		.map((section) => ({ section, fields: section.fields.flatMap((key) => byKey.get(key) ?? []) }))
		.filter((view) => view.fields.length > 0);
	const Sections = SECTION_LAYOUTS[model.sectionStyle];
	// Errors on the payload as a whole, e.g. a key a strict form doesn't allow.
	const rootError = form.errors[''];

	if (model.fields.length === 0) {
		return (
			<Text fz="sm" c="dimmed">
				This form has no fields.
			</Text>
		);
	}

	return (
		<Stack gap="md">
			<FormFieldGrid engine={engine} fields={ungrouped} prefix="" disabled={disabled} />

			{sections.length > 0 && <Sections engine={engine} sections={sections} disabled={disabled} />}

			{rootError && (
				<Alert color="red" variant="light" icon={<LuCircleAlert size={16} />} p="xs">
					<Text fz="xs">{rootError}</Text>
				</Alert>
			)}
		</Stack>
	);
};
