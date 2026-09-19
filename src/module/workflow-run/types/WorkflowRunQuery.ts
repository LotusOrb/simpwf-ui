import type { ComplexQueryParam } from '@common/types/ComplexQueryParam';

import type { WorkflowRunFilterKey } from './WorkflowRunFilterKey';

/** List query param. Module facets ride in `filter`, never as extra top-level keys. */
export type WorkflowRunQuery = ComplexQueryParam<WorkflowRunFilterKey>;
