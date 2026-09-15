import React from 'react';

import { MantineProvider } from '@mantine/core';
import { RouterProvider } from 'react-router';

import { routesConfig } from '@config/routes.config';

import { themeOverride } from '@core/theme/theme.override';

function App() {
  return (
    <MantineProvider theme={themeOverride}>
      <RouterProvider router={routesConfig} />
    </MantineProvider>
  );
}

export default App;
