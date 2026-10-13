// Flattens the `declare const context: …;` declaration a debug run renders (simpwf `pkg/contextschema`) into the
// context paths a path field accepts, e.g. `{ order: { items: { id: string; }[]; }; }` becomes `order`,
// `order.items` and `order.items[0].id`.

type Shape = { kind: 'object'; props: [string, Shape][] } | { kind: 'array'; items: Shape[] } | { kind: 'other' };

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

	const parseType = (): Shape => {
		let shape = parsePrimary();
		while (peek() === '[') {
			pos++;
			expect(']');
			shape = { kind: 'array', items: Array.isArray(shape) ? shape : [shape] };
		}
		// A bare union only appears inside an array, so anything else here is a single type.
		return Array.isArray(shape) ? { kind: 'other' } : shape;
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
	}
};

/** Every context path in a debug run's `context` declaration, parents before children. */
export const contextPathsFromTypes = (typescript: string | undefined): string[] => {
	const shape = typescript ? parseShape(typescript) : null;
	if (!shape) return [];
	const paths = new Set<string>();
	collectPaths(shape, '', paths);
	return [...paths];
};
