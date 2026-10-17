import type { NodeTypeCatalogItem } from './NodeTypeCatalogItem';

export interface NodeTypeCatalog {
	/** Builtins in engine order, then custom types by name. */
	items: NodeTypeCatalogItem[];
	byType: Record<string, NodeTypeCatalogItem>;
}
