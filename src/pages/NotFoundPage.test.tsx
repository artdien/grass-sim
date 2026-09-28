import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { NotFoundPage } from '@/pages/NotFoundPage';

describe('NotFoundPage', () => {
  it('renders the page-not-found heading', () => {
    render(<NotFoundPage />);

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });

  it('explains that the URL did not match any page', () => {
    render(<NotFoundPage />);

    expect(screen.getByText(/The URL you entered did not match any page\./)).toBeInTheDocument();
  });
});
