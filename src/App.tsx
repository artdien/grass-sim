import { Outlet } from 'react-router-dom';
import { Navbar } from '@/Navbar';

export const App = () => {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-green-50">
      <Navbar />
      <main className="relative min-h-0 flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
};
