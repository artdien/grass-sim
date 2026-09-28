import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CollapsibleSection } from '@/components/CollapsibleSection';

describe('CollapsibleSection', () => {
  it('renders the title with its content visible, expanded by default', () => {
    render(<CollapsibleSection title="Wind">Blade settings</CollapsibleSection>);

    const toggle = screen.getByRole('button', { name: 'Wind' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Blade settings')).toBeInTheDocument();
  });

  it('hides and restores the content on each click of the header', () => {
    render(<CollapsibleSection title="Wind">Blade settings</CollapsibleSection>);

    const toggle = screen.getByRole('button', { name: 'Wind' });

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Blade settings')).not.toBeInTheDocument();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Blade settings')).toBeInTheDocument();
  });
});
