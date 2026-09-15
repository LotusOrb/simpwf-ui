import { createBrowserRouter, Navigate } from 'react-router';

import { authRoutes } from '@core/auth/auth.routes';

import { MainLayout } from '@module/app/components/AppMainLayout';

export const routesConfig = createBrowserRouter([
  {
    path: '/',
    Component: () => Navigate({ to: 'auth' }),
  },
  authRoutes,
  {
    path: 'app',
    Component: MainLayout,
  },
]);
