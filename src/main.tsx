import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import '@/index.css';
import { App } from '@/App';
import { ConfigurationPage } from '@/ConfigurationPage';
import { LoadPage } from '@/LoadPage';

const router = createBrowserRouter([
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
        element: <Navigate to="/configuration" replace />,
      },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
