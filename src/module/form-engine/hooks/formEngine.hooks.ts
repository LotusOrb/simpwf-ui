import { useMemo, useState } from 'react';

import { type FormErrors, useForm } from '@mantine/form';

import type { JsonSchema } from '@common/types/JsonSchema';

import type { FormEngine, FormEngineStep, FormValues } from '@module/form-engine/types/FormEngine';
import type { FormRemoteOption } from '@module/form-engine/types/FormRemoteOption';
import {
	buildFormModel,
	buildFormPayload,
	formSteps,
	initialFormValues,
	isPathUnder,
	validateFormPayload,
} from '@module/form-engine/utils';

interface UseFormEngineInput {
	schema: JsonSchema;
	ui?: unknown;
	/** Values to start from instead of the schema defaults. */
	initial?: FormValues;
	/** The run context, for `{{ context.* }}` in remote selects. */
	context?: unknown;
}

/**
 * Form state for `schema` + `ui`, validated with the compiled zod schema against the payload it would deliver.
 * The state starts once: remount (via `key`) to restart it for a different form.
 */
export const useFormEngine = ({ schema, ui, initial, context }: UseFormEngineInput): FormEngine => {
	const model = useMemo(() => buildFormModel(schema, ui), [schema, ui]);
	const [remoteCache] = useState(() => new Map<string, FormRemoteOption[]>());

	const form = useForm<FormValues>({
		mode: 'controlled',
		initialValues: initialFormValues(model, initial),
		validate: (values) => validateFormPayload(model, buildFormPayload(model, values)).errors,
	});

	const steps = formSteps(model);
	const [stepIndex, setStepIndex] = useState(0);
	const index = Math.min(stepIndex, Math.max(steps.length - 1, 0));
	const errorsIn = (at: number, errors: FormErrors) =>
		Object.entries(errors).filter(([path]) => isPathUnder(path, steps[at]?.fields ?? []));

	const step: FormEngineStep = {
		index,
		count: Math.max(steps.length, 1),
		isLast: index >= steps.length - 1,
		go: setStepIndex,
		next: () => {
			const own = errorsIn(index, form.validate().errors);
			// Later steps haven't been filled yet, so their errors would only be noise.
			form.setErrors(Object.fromEntries(own));
			if (own.length === 0) setStepIndex(index + 1);
		},
	};

	const submit = () => {
		const { hasErrors, errors } = form.validate();
		if (hasErrors) {
			const failing = steps.findIndex((_, at) => errorsIn(at, errors).length > 0);
			if (failing >= 0) setStepIndex(failing);
			return null;
		}
		return buildFormPayload(model, form.getValues());
	};

	return {
		model,
		form,
		payload: buildFormPayload(model, form.values),
		context: context ?? {},
		remoteCache,
		step,
		submit,
	};
};
