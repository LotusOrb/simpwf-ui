import type { FormFieldUi } from './FormFieldUi';
import type { FormSection } from './FormSection';
import type { FormSectionStyle } from './FormSectionStyle';

/** Version 1 of the UI's own render contract, stored as a form's `ui`. */
export interface FormUi {
	version: 1;
	/** Top-level field order; unlisted properties are appended in schema order. */
	order?: string[];
	/** `sectionStyle` defaults to `long`. */
	layout?: { columns?: 1 | 2 | 3 | 4; sectionStyle?: FormSectionStyle };
	/** Titled groups of top-level fields; fields not in a section render first, ungrouped. */
	sections?: FormSection[];
	/** By dotted path, e.g. `address.city` or `items.*.sku` for array item properties. */
	fields?: Record<string, FormFieldUi>;
}
