import { useCallback } from 'react';

import { useNavigate } from 'react-router';

export const useNavigateBack = (fallbackPath: string) => {
	const navigate = useNavigate();

	return useCallback(() => {
		const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
		if (idx > 0) navigate(-1);
		else navigate(fallbackPath, { replace: true });
	}, [navigate, fallbackPath]);
};
