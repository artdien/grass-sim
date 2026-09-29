import type { ChangeEvent } from 'react';
import { FieldHelp } from '@/components/fields/FieldHelp';
import { SteppedNumberField } from '@/components/fields/SteppedNumberField';

/** A 3D vector whose components are edited together, left to right as x, y, z. */
interface Vector3 {
  x: number;
  y: number;
  z: number;
}

interface Props {
  /** Base id; each input is ided `${id}-x`, `${id}-y`, `${id}-z`. */
  id: string;

  /** Text shown to the left of the inputs. */
  label: string;

  /** Optional explanation behind the help icon rendered next to the inputs. */
  help?: string;

  /** Current vector committed to the settings. */
  value: Vector3;

  /** Step increment (rendered as the `step` attribute on each input). */
  step?: number;

  /** Fires with the changed component and the raw input event; the caller parses and validates before committing. */
  onChange: (component: keyof Vector3, event: ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Labeled x/y/z number inputs on a single row at the settings sidebar's default width;
 * below 300px of available width the inputs collapse to the rows below, right-aligned at
 * their natural width with their component letter shown since the left-to-right order no
 * longer conveys x/y/z, while the help icon stays on the label's row, at the right.
 */
export const VectorField = ({ id, label, help, value, step, onChange }: Props) => {
  const components: Array<keyof Vector3> = ['x', 'y', 'z'];

  return (
    <div className="@container flex flex-wrap items-center justify-between gap-2 text-sm text-stone-600">
      <span className="shrink-0">{label}</span>
      <div className="ml-auto flex shrink-0 items-center gap-1.5 @max-[300px]:order-2 @max-[300px]:w-full @max-[300px]:justify-end">
        <div className="flex min-w-0 gap-1 @max-[300px]:flex-col @max-[300px]:gap-2">
          {components.map((component) => (
            <div key={component} className="flex items-center gap-1.5">
              <span className="hidden w-3 text-xs text-stone-500 @max-[300px]:block">
                {component}
              </span>
              <SteppedNumberField
                key={component}
                id={`${id}-${component}`}
                value={value[component]}
                step={step}
                ariaLabel={`${label} ${component.toUpperCase()}`}
                onChange={(event) => onChange(component, event)}
                className="w-16 rounded-md border border-stone-200 bg-white px-1.5 py-1 text-right font-mono text-xs text-stone-900 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 focus-visible:outline-none"
              />
            </div>
          ))}
        </div>
      </div>
      {help ? (
        <span className="shrink-0 @max-[300px]:order-1">
          <FieldHelp help={help} label={label} />
        </span>
      ) : null}
    </div>
  );
};
