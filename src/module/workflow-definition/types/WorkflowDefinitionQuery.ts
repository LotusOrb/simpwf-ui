import type { ComplexQueryParam } from '@common/types/ComplexQueryParam';

import type { WorkflowDefinitionFilterKey } from './WorkflowDefinitionFilterKey';

/** List query param. Module facets ride in `filter`, never as extra top-level keys. */
export type WorkflowDefinitionQuery = ComplexQueryParam<WorkflowDefinitionFilterKey>;
