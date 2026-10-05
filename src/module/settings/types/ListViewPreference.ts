import type { ViewMode } from '@common/component/ViewModeToggle';

export type ListViewKey = 'workflowDefinition' | 'workflowRun';

export type ListViewPreference = Record<ListViewKey, ViewMode>;
