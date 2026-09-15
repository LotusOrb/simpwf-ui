import React from 'react';

import { Navigate, type RouteObject } from 'react-router';
import { LoginPage } from './pages/LoginPage';

export const authRoutes: RouteObject = {
  path: 'auth',
  children: [
    {
      index: true,
      Component: () => <Navigate to={'login'} />,
    },
    {
      path: 'login',
      Component: LoginPage
    },
  ],
};
