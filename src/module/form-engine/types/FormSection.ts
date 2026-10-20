export interface FormSection {
	id: string;
	title: string;
	description?: string;
	/** Top-level property keys, in display order. */
	fields: string[];
}
