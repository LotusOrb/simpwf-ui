import type { AuthMe } from '@core/auth/types/AuthMe';

import { WILDCARD_PERMISSION, type Permission } from './permission';

type PermissionNode =
	| { kind: 'perm'; permission: Permission }
	| { kind: 'and'; nodes: PermissionNode[] }
	| { kind: 'or'; nodes: PermissionNode[] };

type Operator = 'and' | 'or';

export type PermissionGroup = (clause: PermissionClause) => PermissionClause;

// An empty group is an empty AND, which evaluates to false: deny by default.
const EMPTY: PermissionNode = { kind: 'and', nodes: [] };

// Left fold with no precedence: the expression so far is combined with the next node, so a chain reads as it evaluates.
const combine = (current: PermissionNode | null, op: Operator, next: PermissionNode): PermissionNode => {
	if (!current) return next;
	// An empty node is a literal false, so it is nested rather than flattened into.
	if (current.kind === op && current.nodes.length > 0) return { kind: op, nodes: [...current.nodes, next] };
	return { kind: op, nodes: [current, next] };
};

const resolveGroup = (group: PermissionGroup): PermissionNode => group(new PermissionClause()).toNode();

export class PermissionClause {
	private node: PermissionNode | null = null;

	/** ANDs a permission into this clause. */
	add(permission: Permission): this {
		this.node = combine(this.node, 'and', { kind: 'perm', permission });
		return this;
	}

	/** ANDs a nested clause into this clause. */
	and(group: PermissionGroup): this {
		this.node = combine(this.node, 'and', resolveGroup(group));
		return this;
	}

	/** ORs a nested clause into this clause. */
	or(group: PermissionGroup): this {
		this.node = combine(this.node, 'or', resolveGroup(group));
		return this;
	}

	toNode(): PermissionNode {
		return this.node ?? EMPTY;
	}
}

export class AuthorizationBuilder {
	private readonly authorization: Authorization;
	private node: PermissionNode | null = null;

	constructor(authorization: Authorization) {
		this.authorization = authorization;
	}

	/** ORs a new group into the expression. */
	add(group: PermissionGroup): this {
		return this.or(group);
	}

	/** ANDs a group into the expression. */
	and(group: PermissionGroup): this {
		this.node = combine(this.node, 'and', resolveGroup(group));
		return this;
	}

	/** ORs a group into the expression. */
	or(group: PermissionGroup): this {
		this.node = combine(this.node, 'or', resolveGroup(group));
		return this;
	}

	evaluate(): boolean {
		return this.authorization.evaluateNode(this.node ?? EMPTY);
	}
}

export type PermissionRule = Permission | ((auth: Authorization) => boolean | AuthorizationBuilder);

export class Authorization {
	private readonly permissions: ReadonlySet<string>;
	private readonly bypass: boolean;

	private constructor(permissions: ReadonlySet<string>, bypass: boolean) {
		this.permissions = permissions;
		this.bypass = bypass;
	}

	/** Anonymous, service and wildcard callers. */
	static allowAll(): Authorization {
		return new Authorization(new Set(), true);
	}

	/** No session, or /auth/me failed. */
	static denyAll(): Authorization {
		return new Authorization(new Set(), false);
	}

	static fromMe(me: AuthMe): Authorization {
		const permissions = new Set(me.permissions ?? []);
		return new Authorization(permissions, me.service || permissions.has(WILDCARD_PERMISSION));
	}

	can(permission: Permission): boolean {
		return this.bypass || this.permissions.has(permission);
	}

	canAll(...permissions: Permission[]): boolean {
		return permissions.length > 0 && permissions.every((permission) => this.can(permission));
	}

	canAny(...permissions: Permission[]): boolean {
		return permissions.some((permission) => this.can(permission));
	}

	/** Starts a fresh builder; each call is independent. */
	add(group: PermissionGroup): AuthorizationBuilder {
		return new AuthorizationBuilder(this).add(group);
	}

	and(group: PermissionGroup): AuthorizationBuilder {
		return new AuthorizationBuilder(this).and(group);
	}

	or(group: PermissionGroup): AuthorizationBuilder {
		return new AuthorizationBuilder(this).or(group);
	}

	evaluate(rule: PermissionRule): boolean {
		if (typeof rule === 'string') return this.can(rule);
		const result = rule(this);
		return typeof result === 'boolean' ? result : result.evaluate();
	}

	/** @internal Walks a builder's expression tree; the wildcard already short-circuits inside can(). */
	evaluateNode(node: PermissionNode): boolean {
		switch (node.kind) {
			case 'perm':
				return this.can(node.permission);
			case 'and':
				return node.nodes.length > 0 && node.nodes.every((child) => this.evaluateNode(child));
			case 'or':
				return node.nodes.some((child) => this.evaluateNode(child));
		}
	}
}
