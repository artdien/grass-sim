import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FieldHelp } from '@/components/fields/FieldHelp';

describe('FieldHelp', () => {
  it('renders a help button without the popover', () => {
    render(<FieldHelp help="How wide the blade is." label="Width" />);

    const button = screen.getByRole('button', { name: /what width does/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows the explanation in a popover when clicked, and hides it when clicked again', () => {
    render(<FieldHelp help="How wide the blade is." label="Width" />);

    const button = screen.getByRole('button', { name: /what width does/i });
    fireEvent.click(button);

    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('tooltip')).toHaveTextContent('How wide the blade is.');

    fireEvent.click(button);

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('closes when a pointer is pressed anywhere outside the icon and popover', () => {
    render(<FieldHelp help="How wide the blade is." label="Width" />);

    const button = screen.getByRole('button', { name: /what width does/i });
    fireEvent.click(button);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.pointerDown(document.body);

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
