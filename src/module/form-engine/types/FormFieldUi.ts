import type { FormCondition } from './FormCondition';
import type { FormGroupStyle } from './FormGroupStyle';
import type { FormRemoteOptions } from './FormRemoteOptions';
import type { FormWidget } from './FormWidget';

export interface FormFieldUi {
	/** Defaults from the schema type and format. */
	widget?: FormWidget;
	/** Defaults to the schema `title`. */
	label?: string;
	placeholder?: string;
	/** Defaults to the schema `description`. */
	help?: string;
	colSpan?: number;
	visibleWhen?: FormCondition;
	/** Only for `group` and `repeater`; defaults to `default`. */
	groupStyle?: FormGroupStyle;
	/** Only for `group` and `repeater`: child order; unlisted properties are appended in schema order. */
	order?: string[];
	/** Only for `remote-select`. */
	options?: FormRemoteOptions;
}
