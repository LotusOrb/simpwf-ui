import type { JsonSchema } from '@common/types/JsonSchema';

import type { FormFieldModel } from './FormFieldModel';
import type { FormSection } from './FormSection';
import type { FormSectionStyle } from './FormSectionStyle';

/** A whole form, resolved for rendering. Built once per `{schema, ui}` by `buildFormModel`. */
export interface FormModel {
	root: JsonSchema;
	/** Top-level fields in display order. */
	fields: FormFieldModel[];
	/** Top-level keys not claimed by a section; they render first. */
	ungrouped: string[];
	/** Sections with keys that don't exist dropped. */
	sections: FormSection[];
	sectionStyle: FormSectionStyle;
	columns: number;
	/** The root sets `additionalProperties: false`. */
	strict: boolean;
	/** What the model had to ignore or fall back on, for the builder to show. */
	warnings: string[];
}
