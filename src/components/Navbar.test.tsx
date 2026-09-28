import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, it } from 'vitest';

import { Navbar } from '@/components/Navbar';

const renderNavbar = () => render(<Navbar />, { wrapper: MemoryRouter });

it('renders the navigation links', () => {
  renderNavbar();

  expect(screen.getByRole('link', { name: 'Simulation' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Load' })).toBeInTheDocument();
});
