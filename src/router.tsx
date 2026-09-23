import { createBrowserRouter, Navigate } from 'react-router-dom';
import { App } from '@/App';
import { ConfigurationPage } from '@/pages/ConfigurationPage';
import { LoadPage } from '@/pages/LoadPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Navigate to="/configuration" replace />,
      },
      {
        path: 'configuration',
        element: <ConfigurationPage />,
      },
      {
        path: 'load',
        element: <LoadPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
