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

/** Labeled x/y/z number inputs on a single row, matching the label rows of the settings sidebar. */
export const VectorField = ({ id, label, help, value, step, onChange }: Props) => {
  const components: Array<keyof Vector3> = ['x', 'y', 'z'];

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-stone-600">
      <span className="shrink-0">{label}</span>
      <div className="flex shrink-0 items-center gap-1.5">
        <div className="flex min-w-0 gap-1">
          {components.map((component) => (
            <SteppedNumberField
              key={component}
              id={`${id}-${component}`}
              value={value[component]}
              step={step}
              ariaLabel={`${label} ${component.toUpperCase()}`}
              onChange={(event) => onChange(component, event)}
              className="w-16 min-w-0 shrink rounded-md border border-stone-200 bg-white px-1.5 py-1 text-right font-mono text-xs text-stone-900 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 focus-visible:outline-none"
            />
          ))}
        </div>
        {help ? <FieldHelp help={help} label={label} /> : null}
      </div>
    </div>
  );
};
