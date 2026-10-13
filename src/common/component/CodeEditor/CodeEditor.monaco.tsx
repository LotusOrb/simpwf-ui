import React, { useEffect, useId } from 'react';

import { Editor, loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import EditorWorker from 'monaco-editor/editor/editor.worker?worker';
import JsonWorker from 'monaco-editor/language/json/json.worker?worker';
import TsWorker from 'monaco-editor/language/typescript/ts.worker?worker';

import type { CodeEditorLanguage } from './CodeEditor.types';

self.MonacoEnvironment = {
	getWorker: (_workerId, label) => {
		if (label === 'json') return new JsonWorker();
		if (label === 'typescript' || label === 'javascript') return new TsWorker();
		return new EditorWorker();
	},
};

loader.config({ monaco });

// Scripts are function bodies, so a top-level `return` (TS1108) is valid here.
monaco.typescript.javascriptDefaults.setDiagnosticsOptions({ diagnosticCodesToIgnore: [1108] });
monaco.typescript.javascriptDefaults.setCompilerOptions({
	target: monaco.typescript.ScriptTarget.ES2020,
	allowNonTsExtensions: true,
	lib: ['es2020'],
});
monaco.typescript.javascriptDefaults.addExtraLib(
	[
		'/** Workflow context. Mutable in script nodes, frozen in conditions, predicates and validation. */',
		'declare const context: Record<string, any>;',
		'/** Script: value at input_data. Input validation: raw payload string. */',
		'declare const input: any;',
		'/** Post-script: the native node output. */',
		'declare const output: any;',
		'/** Poller until: the normalized response. */',
		'declare const response: { body: any; headers?: Record<string, any>; status?: number };',
	].join('\n'),
	'simpwf-globals.d.ts',
);

// Monaco's JSON diagnostics options are global, so every mounted editor's schema is kept here and re-applied as one
// list. Each entry is scoped by `fileMatch` to that editor's own model URI, so other JSON editors are unaffected.
const jsonSchemas = new Map<string, object>();

const applyJsonSchemas = () =>
	monaco.json.jsonDefaults.setDiagnosticsOptions({
		...monaco.json.jsonDefaults.diagnosticsOptions,
		validate: true,
		enableSchemaRequest: false,
		schemas: [...jsonSchemas].map(([modelUri, schema]) => ({
			uri: `${modelUri}.schema`,
			fileMatch: [modelUri],
			schema,
		})),
	});

interface CodeEditorMonacoProps {
	value: string;
	onChange?: (value: string) => void;
	language: CodeEditorLanguage;
	height: number | string;
	readOnly?: boolean;
	placeholder?: string;
	jsonSchema?: object;
}

const CodeEditorMonaco: React.FC<CodeEditorMonacoProps> = ({
	value,
	onChange,
	language,
	height,
	readOnly,
	placeholder,
	jsonSchema,
}) => {
	// A model URI of its own, so a schema applies to this editor only (an expanded copy gets another one).
	const id = useId().replace(/[^a-zA-Z0-9]/g, '');
	const modelUri = monaco.Uri.from({ scheme: 'inmemory', path: `/code-editor/${id}.json` }).toString();
	const scoped = !!jsonSchema && language === 'json';

	useEffect(() => {
		if (!scoped) return;
		jsonSchemas.set(modelUri, jsonSchema);
		applyJsonSchemas();
		return () => {
			jsonSchemas.delete(modelUri);
			applyJsonSchemas();
		};
	}, [modelUri, jsonSchema, scoped]);

	return (
		<Editor
			// Editors without a schema keep Monaco's default model URI.
			path={scoped ? modelUri : undefined}
			value={value}
			onChange={(next) => onChange?.(next ?? '')}
			language={language}
			height={height}
			theme="vs"
			options={{
				readOnly,
				placeholder,
				fontSize: 13,
				tabSize: 2,
				minimap: { enabled: false },
				scrollBeyondLastLine: false,
				wordWrap: 'on',
				lineNumbersMinChars: 3,
				folding: false,
				glyphMargin: false,
				renderLineHighlight: 'none',
				overviewRulerLanes: 0,
				hideCursorInOverviewRuler: true,
				scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8, alwaysConsumeMouseWheel: false },
				padding: { top: 8, bottom: 8 },
				automaticLayout: true,
				fixedOverflowWidgets: true,
			}}
		/>
	);
};

export default CodeEditorMonaco;
