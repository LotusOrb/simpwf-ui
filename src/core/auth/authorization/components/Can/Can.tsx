import React from 'react';

import type { PermissionRule } from '@core/auth/authorization/authorization';
import { useCan } from '@core/auth/authorization/authorization.hooks';

interface CanProps {
	rule: PermissionRule;
	fallback?: React.ReactNode;
	children: React.ReactNode;
}

/** Renders children only when the caller satisfies the rule; denied UI is hidden by default. */
export const Can: React.FC<CanProps> = ({ rule, fallback = null, children }) => {
	return useCan(rule) ? children : fallback;
};
