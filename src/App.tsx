import { Renderer } from '@/Renderer';

export const App = () => {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-slate-900">
      <div className="absolute inset-0 z-0">
        <Renderer />
      </div>
    </main>
  );
};
