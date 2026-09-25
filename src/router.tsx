import { createBrowserRouter, Navigate } from 'react-router-dom';
import { App } from '@/App';
import { ImportSettingsPage } from '@/pages/ImportSettingsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { SimulationPage } from '@/pages/SimulationPage';

/** App route table: the `App` layout route with `/simulation`, `/import-settings`, and a catch-all. */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Navigate to="/simulation" replace />,
      },
      {
        path: 'simulation',
        element: <SimulationPage />,
      },
      {
        path: 'import-settings',
        element: <ImportSettingsPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
