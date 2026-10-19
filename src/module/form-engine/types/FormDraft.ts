import type { FormDraftField } from './FormDraftField';
import type { FormSection } from './FormSection';
import type { FormSectionStyle } from './FormSectionStyle';

/** The builder's model of a form; `form.draft.ts` converts it to and from `{schema, ui}`. */
export interface FormDraft {
	name: string;
	fields: FormDraftField[];
	columns: 1 | 2 | 3 | 4;
	/** Sections list top-level keys; a key in none renders ungrouped. */
	sections: FormSection[];
	/** Only applies while there are sections. */
	sectionStyle: FormSectionStyle;
	/** Sets `additionalProperties: false` on the root. */
	strict: boolean;
	/** Root schema keywords kept as they are, e.g. `$schema`, `title`, `$defs`. */
	rootExtra: Record<string, unknown>;
}
