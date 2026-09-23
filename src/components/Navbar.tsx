import { NavLink, useLocation } from 'react-router-dom';

const linkClassName = (isActive: boolean) =>
  [
    'rounded-md px-0.5 py-0.5 text-sm font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
    isActive ? 'text-green-700' : 'text-stone-500 hover:text-stone-900',
  ].join(' ');

export const Navbar = () => {
  const { pathname } = useLocation();
  // Normalize trailing slashes so both "/page" and "/page/" count as the same page,
  // while unrelated paths (e.g. "/page/doesnotexist") do not highlight any link.
  const normalizedPathname = pathname.replace(/\/+$/, '') || '/';
  const isActive = (to: string) => normalizedPathname === to;

  return (
    <nav
      aria-label="Main"
      className="flex items-center gap-8 border-b border-stone-200 bg-white px-6 py-3"
    >
      <span className="text-base leading-tight font-semibold text-stone-900" aria-hidden="true">
        Grass
        <br />
        Simulation
      </span>
      <div className="flex items-center gap-6">
        <NavLink to="/configuration" className={linkClassName(isActive('/configuration'))}>
          Configuration
        </NavLink>
        <NavLink to="/load" className={linkClassName(isActive('/load'))}>
          Load
        </NavLink>
      </div>
    </nav>
  );
};
