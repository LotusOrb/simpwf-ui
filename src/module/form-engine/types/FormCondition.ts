import type { FormConditionOp } from './FormConditionOp';

/** A leaf compares one field by dotted path; `all` / `any` combine leaves. */
export type FormCondition =
	| { field: string; op: FormConditionOp; value?: unknown }
	| { all: FormCondition[] }
	| { any: FormCondition[] };
