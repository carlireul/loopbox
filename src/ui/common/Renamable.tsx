import { useRef, useState, type ReactNode } from 'react';

interface RenamableProps {
  name: string | number;
  onChange: (value: string) => void;
  number?: boolean;
  min?: number;
  max?: number;
  step?: number;
  children?: ReactNode;
}

/**
 * Click-to-edit inline label, used for track/project names and numeric params.
 * Ported from the legacy Renamable with the same click-value / confirm flow.
 */
export function Renamable({
  name,
  onChange,
  number,
  min,
  max,
  step,
  children,
}: RenamableProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(name));
  const inputRef = useRef<HTMLInputElement>(null);

  const confirm = () => {
    if (inputRef.current?.validity.valid ?? true) {
      onChange(value);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1">
        <input
          ref={inputRef}
          className="control w-24"
          type={number ? 'number' : 'text'}
          min={min}
          max={max}
          step={step}
          value={value}
          autoFocus
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && confirm()}
        />
        <button className="track-button" onClick={confirm} aria-label="Confirm">
          <i className="fa-solid fa-check" />
        </button>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <button
        className="font-bold text-sky-700 hover:underline"
        onClick={() => {
          setValue(String(name));
          setEditing(true);
        }}
        title={number ? `Click to change (${min}–${max})` : 'Click to rename'}
      >
        {name}
      </button>
      {children}
    </span>
  );
}
