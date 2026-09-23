import { Renderer } from '@/Renderer';
import { SideBar } from '@/SideBar';

export const ConfigurationPage = () => {
  return (
    <div className="flex h-full">
      <SideBar />
      <div className="min-w-0 flex-1">
        <Renderer />
      </div>
    </div>
  );
};
