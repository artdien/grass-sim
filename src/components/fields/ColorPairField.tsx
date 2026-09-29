import type { ChangeEvent } from 'react';
import { FieldHelp } from '@/components/fields/FieldHelp';

interface Props {
  /** Unique id prefix; each picker is bound to `${id}-base` and `${id}-tip`. */
  id: string;

  /** Text shown to the left of the pickers, e.g. "Palette 1". */
  label: string;

  /** Optional explanation behind the help icon rendered next to the pickers. */
  help?: string;

  /** Current base color as a hex string (#rrggbb). */
  baseValue: string;

  /** Current tip color as a hex string (#rrggbb). */
  tipValue: string;

  /** Fires when the base picker changes; its value is always a valid hex string. */
  onBaseChange: (event: ChangeEvent<HTMLInputElement>) => void;

  /** Fires when the tip picker changes; its value is always a valid hex string. */
  onTipChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

/**
 * A base + tip pair of color pickers, both on one row at the settings sidebar's default
 * width; below 250px of available width the pickers collapse to the rows below,
 * right-aligned at their natural width, while the help icon stays on the label's row,
 * at the right.
 */
export const ColorPairField = ({
  id,
  label,
  help,
  baseValue,
  tipValue,
  onBaseChange,
  onTipChange,
}: Props) => (
  <div className="@container flex flex-wrap items-center justify-between gap-2 text-sm text-stone-600">
    <span className="shrink-0">{label}</span>
    <div className="ml-auto flex shrink-0 items-center gap-3 @max-[250px]:order-2 @max-[250px]:w-full @max-[250px]:justify-end">
      <div className="flex shrink-0 items-center gap-3 @max-[250px]:flex-col @max-[250px]:items-end @max-[250px]:gap-2">
        <label className="flex items-center gap-1.5 text-xs text-stone-500">
          Base
          <input
            id={`${id}-base`}
            type="color"
            value={baseValue}
            onChange={onBaseChange}
            className="h-7 w-10 cursor-pointer rounded-md border border-stone-200 bg-white p-0.5 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 focus-visible:outline-none"
          />
        </label>
        <label className="flex items-center gap-1.5 text-xs text-stone-500">
          Tip
          <input
            id={`${id}-tip`}
            type="color"
            value={tipValue}
            onChange={onTipChange}
            className="h-7 w-10 cursor-pointer rounded-md border border-stone-200 bg-white p-0.5 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 focus-visible:outline-none"
          />
        </label>
      </div>
    </div>
    {help ? (
      <span className="shrink-0 @max-[250px]:order-1">
        <FieldHelp help={help} label={label} />
      </span>
    ) : null}
  </div>
);
