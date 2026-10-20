import type { UseFormReturnType } from '@mantine/form';

import type { FormModel } from './FormModel';
import type { FormRemoteOption } from './FormRemoteOption';

export type FormValues = Record<string, unknown>;

/** Where a stepper form is. A form that isn't a stepper is a single step, so `isLast` is always true there. */
export interface FormEngineStep {
	index: number;
	count: number;
	isLast: boolean;
	go: (index: number) => void;
	/** Validates the current step's fields only, and moves on when they pass. */
	next: () => void;
}

/** A live form: its resolved model, the Mantine form holding its state, and the payload it would deliver. */
export interface FormEngine {
	model: FormModel;
	form: UseFormReturnType<FormValues>;
	/** The current payload: hidden fields pruned, empty optional fields omitted. */
	payload: FormValues;
	/** The run context `{{ context.* }}` reads from. */
	context: unknown;
	/** Remote-select results by request, kept for as long as this form is open. */
	remoteCache: Map<string, FormRemoteOption[]>;
	step: FormEngineStep;
	/**
	 * Validates and returns the payload, or null (with errors shown on the fields) when it doesn't pass; a stepper
	 * then goes to the first step with errors.
	 */
	submit: () => FormValues | null;
}
