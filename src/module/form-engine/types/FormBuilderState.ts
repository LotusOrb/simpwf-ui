import type { JsonSchema } from '@common/types/JsonSchema';

import type { FormBuilderContainer } from '@module/form-engine/utils';

import type { FormDraft } from './FormDraft';
import type { FormModel } from './FormModel';
import type { FormUi } from './FormUi';
import type { FormWidget } from './FormWidget';

export type FormBuilderTab = 'build' | 'json' | 'preview';

export interface FormBuilderState {
	draft: FormDraft;
	update: (fn: (draft: FormDraft) => FormDraft) => void;
	selectedId: string | null;
	select: (id: string | null) => void;
	/** Adds a field into the selected group or repeater, else after the selected field, else at the end. */
	add: (widget: FormWidget) => void;
	/** Adds a field at a given place, e.g. where one was dropped from the palette. */
	addAt: (widget: FormWidget, container: FormBuilderContainer, index: number) => void;
	/** Where `add` puts the next field, e.g. "after email". */
	addTarget: string;
	tab: FormBuilderTab;
	/** Ignored while the JSON tab holds an invalid edit. */
	setTab: (tab: FormBuilderTab) => void;
	/** The JSON tab's text; a valid edit replaces the draft. */
	json: { schema: string; ui: string };
	setJson: (part: 'schema' | 'ui', text: string) => void;
	jsonError: string | null;
	/** What saving sends. */
	output: { schema: JsonSchema; ui?: FormUi };
	model: FormModel;
	/** Things kept as JSON or ignored; informational. */
	warnings: string[];
	/** Things that block saving. */
	issues: string[];
	dirty: boolean;
	markSaved: () => void;
	/** Back to the draft as last saved. */
	discard: () => void;
}
