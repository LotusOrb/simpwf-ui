/**
 * Every cache tag in the app. Keeping them in one object means a typo in an
 * endpoint's `providesTags` / `invalidatesTags` is a compile error rather than
 * a silently-dead invalidation.
 */
export const apiTagConfig = {
	workflowDefinition: 'WorkflowDefinition',
	workflowRun: 'WorkflowRun',
} as const;

export type ApiTag = (typeof apiTagConfig)[keyof typeof apiTagConfig];

/** The `tagTypes` array `createApi` is registered with. */
export const apiTagList = Object.values(apiTagConfig) as ApiTag[];

/**
 * Shared id for "the whole collection" tags, so a create/delete can invalidate
 * every page at once while an update only touches the rows it changed.
 */
export const API_TAG_LIST_ID = 'LIST';
