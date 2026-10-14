// Flattens the `declare const context: …;` declaration a debug run renders (simpwf `pkg/contextschema`) into the
// context paths a path field accepts, e.g. `{ order: { items: { id: string; }[]; }; }` becomes `order`,
// `order.items` and `order.items[0].id`.

type Shape =
	| { kind: 'object'; props: [string, Shape][] }
	| { kind: 'array'; items: Shape[] }
	| { kind: 'union'; members: Shape[] }
	| { kind: 'other' };

const IDENTIFIER = /^[A-Za-z_]\w*$/;
const DECLARATION = /^\s*declare\s+const\s+context\s*:/;

const parseShape = (source: string): Shape | null => {
	let pos = 0;
	const skipSpace = () => {
		while (pos < source.length && /\s/.test(source[pos])) pos++;
	};
	const peek = () => {
		skipSpace();
		return source[pos];
	};
	const expect = (char: string) => {
		if (peek() !== char) throw new Error(`Expected ${char} at ${pos}`);
		pos++;
	};

	const parseKey = (): string => {
		if (peek() === '"') {
			pos++;
			let key = '';
			while (pos < source.length && source[pos] !== '"') {
				if (source[pos] === '\\') pos++;
				key += source[pos++];
			}
			expect('"');
			return key;
		}
		const start = pos;
		while (pos < source.length && /[\w$]/.test(source[pos])) pos++;
		if (start === pos) throw new Error(`Expected key at ${pos}`);
		return source.slice(start, pos);
	};

	const parsePrimary = (): Shape | Shape[] => {
		const char = peek();
		if (char === '{') {
			pos++;
			const props: [string, Shape][] = [];
			while (peek() !== '}') {
				const key = parseKey();
				// Optional keys (`key?: T`) come from types inferred on the client.
				if (peek() === '?') pos++;
				expect(':');
				props.push([key, parseType()]);
				expect(';');
			}
			pos++;
			return { kind: 'object', props };
		}
		if (char === '(') {
			pos++;
			const members = [parseType()];
			while (peek() === '|') {
				pos++;
				members.push(parseType());
			}
			expect(')');
			return members;
		}
		// string, number, unknown, null, Record<string, unknown>, …
		parseKey();
		if (peek() === '<') {
			let depth = 0;
			do {
				if (source[pos] === '<') depth++;
				else if (source[pos] === '>') depth--;
				pos++;
			} while (depth > 0 && pos < source.length);
		}
		return { kind: 'other' };
	};

	const parseMember = (): Shape => {
		let shape = parsePrimary();
		while (peek() === '[') {
			pos++;
			expect(']');
			shape = { kind: 'array', items: Array.isArray(shape) ? shape : [shape] };
		}
		return Array.isArray(shape) ? { kind: 'union', members: shape } : shape;
	};

	const parseType = (): Shape => {
		const members = [parseMember()];
		while (peek() === '|') {
			pos++;
			members.push(parseMember());
		}
		return members.length === 1 ? members[0] : { kind: 'union', members };
	};

	const match = DECLARATION.exec(source);
	if (!match) return null;
	pos = match[0].length;
	try {
		return parseType();
	} catch {
		return null;
	}
};

const collectPaths = (shape: Shape, prefix: string, paths: Set<string>) => {
	if (shape.kind === 'object') {
		for (const [key, child] of shape.props) {
			// Keys like `foo-bar` can't be written as a context path.
			if (!IDENTIFIER.test(key)) continue;
			const path = prefix ? `${prefix}.${key}` : key;
			paths.add(path);
			collectPaths(child, path, paths);
		}
	} else if (shape.kind === 'array') {
		for (const item of shape.items) collectPaths(item, `${prefix}[0]`, paths);
	} else if (shape.kind === 'union') {
		for (const member of shape.members) collectPaths(member, prefix, paths);
	}
};

/** Every context path in a `context` declaration (a debug run's or {@link contextTypesFromValue}'s), parents before children. */
export const contextPathsFromTypes = (typescript: string | undefined): string[] => {
	const shape = typescript ? parseShape(typescript) : null;
	if (!shape) return [];
	const paths = new Set<string>();
	collectPaths(shape, '', paths);
	return [...paths];
};

// Inferring a declaration from a run's raw context (`GET /instance/{id}/context`), for runs that aren't debug runs.

const MAX_DEPTH = 8;
const MAX_ARRAY_SAMPLE = 50;
const TS_IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

/** Every type a value can have, as a union: at most one object and one array member, plus primitives. */
interface Inferred {
	primitives: Set<string>;
	object?: Map<string, { type: Inferred; optional: boolean }>;
	/** Element type; undefined while only empty arrays were seen. */
	array?: { items?: Inferred };
}

const inferValue = (value: unknown, depth: number): Inferred => {
	if (value === null) return { primitives: new Set(['null']) };
	if (Array.isArray(value)) {
		if (depth >= MAX_DEPTH) return { primitives: new Set(['unknown[]']) };
		const items = value
			.slice(0, MAX_ARRAY_SAMPLE)
			.map((item) => inferValue(item, depth + 1))
			.reduce<Inferred | undefined>((merged, item) => (merged ? mergeInferred(merged, item) : item), undefined);
		return { primitives: new Set(), array: { items } };
	}
	if (typeof value === 'object') {
		if (depth >= MAX_DEPTH) return { primitives: new Set(['Record<string, unknown>']) };
		const object = new Map<string, { type: Inferred; optional: boolean }>();
		for (const [key, child] of Object.entries(value)) {
			object.set(key, { type: inferValue(child, depth + 1), optional: false });
		}
		return { primitives: new Set(), object };
	}
	if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
		return { primitives: new Set([typeof value]) };
	}
	return { primitives: new Set(['unknown']) };
};

const mergeInferred = (a: Inferred, b: Inferred): Inferred => {
	const merged: Inferred = { primitives: new Set([...a.primitives, ...b.primitives]) };

	if (a.object && b.object) {
		// A key some elements lack becomes optional.
		merged.object = new Map();
		for (const key of new Set([...a.object.keys(), ...b.object.keys()])) {
			const left = a.object.get(key);
			const right = b.object.get(key);
			merged.object.set(
				key,
				left && right
					? { type: mergeInferred(left.type, right.type), optional: left.optional || right.optional }
					: { type: (left ?? right)!.type, optional: true },
			);
		}
	} else {
		merged.object = a.object ?? b.object;
	}

	if (a.array && b.array) {
		const items =
			a.array.items && b.array.items
				? mergeInferred(a.array.items, b.array.items)
				: (a.array.items ?? b.array.items);
		merged.array = { items };
	} else {
		merged.array = a.array ?? b.array;
	}

	return merged;
};

const renderMembers = (type: Inferred): string[] => {
	const members: string[] = [];
	if (type.object) {
		const props = [...type.object].map(
			([key, prop]) =>
				`${TS_IDENTIFIER.test(key) ? key : JSON.stringify(key)}${prop.optional ? '?' : ''}: ${renderInferred(prop.type)};`,
		);
		members.push(props.length > 0 ? `{ ${props.join(' ')} }` : '{}');
	}
	if (type.array) {
		const items = type.array.items ? renderMembers(type.array.items) : ['unknown'];
		members.push(items.length === 1 ? `${items[0]}[]` : `(${items.join(' | ')})[]`);
	}
	members.push(...type.primitives);
	return members;
};

const renderInferred = (type: Inferred): string => {
	const members = renderMembers(type);
	return members.length === 0 ? 'unknown' : members.join(' | ');
};

/**
 * Infers a `declare const context: …;` declaration from a context value, in the shape a debug run renders, so
 * {@link contextPathsFromTypes} and Monaco read it the same way.
 */
export const contextTypesFromValue = (value: unknown): string =>
	`declare const context: ${renderInferred(inferValue(value ?? {}, 0))};`;
