import { createBrowserRouter, Navigate } from 'react-router-dom';
import { App } from '@/App';
import { LoadSettingsPage } from '@/pages/LoadSettingsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { SimulationPage } from '@/pages/SimulationPage';

/**
 * App route table: the `App` layout route with `/simulation`, `/load-settings`, and a catch-all.
 * `basename` tracks Vite's `base` so routes resolve under the GitHub Pages project path.
 */
const routes = [
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
];

export const router = createBrowserRouter(routes, { basename: import.meta.env.BASE_URL });
