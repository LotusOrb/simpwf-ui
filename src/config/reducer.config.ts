import { combineSlices } from '@reduxjs/toolkit';

import { coreApi } from '@core/api';
import { authSlice } from '@core/auth/store';

import { appLayoutSlice } from '@module/app/store';
import { workflowDefinitionEditorSlice } from '@module/workflow-definition/store';

export const coreReducer = combineSlices(authSlice, appLayoutSlice, workflowDefinitionEditorSlice, coreApi);
