import { createBrowserRouter, Navigate } from 'react-router-dom';
import { App } from '@/App';
import { LoadSettingsPage } from '@/pages/LoadSettingsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { SimulationPage } from '@/pages/SimulationPage';

/** App route table: the `App` layout route with `/simulation`, `/load-settings`, and a catch-all. */
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
        path: 'load-settings',
        element: <LoadSettingsPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
