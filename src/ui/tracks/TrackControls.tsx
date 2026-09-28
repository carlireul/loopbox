import type { ReactNode } from 'react';
import { useProjectStore } from '../../store/projectStore';

const volIcon = (vol: number) =>
  vol <= -20 ? 'fa-volume-off' : vol >= 8 ? 'fa-volume-high' : 'fa-volume-low';

/** Mute / solo / volume / pan for a track. Extra controls go in `children`. */
export function TrackControls({
  id,
  children,
}: {
  id: string;
  children?: ReactNode;
}) {
  const controls = useProjectStore((s) => s.tracks[id]?.controls);
  const toggleMute = useProjectStore((s) => s.toggleMute);
  const toggleSolo = useProjectStore((s) => s.toggleSolo);
  const updateControls = useProjectStore((s) => s.updateControls);
  if (!controls) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        className="track-button"
        onClick={() => toggleSolo(id)}
        aria-label="Solo"
        aria-pressed={controls.solod}
      >
        <i
          className="fa-solid fa-headphones"
          style={controls.solod ? { color: 'var(--brand)' } : undefined}
        />
      </button>
      <button
        className="track-button"
        onClick={() => toggleMute(id)}
        aria-label="Mute"
        aria-pressed={controls.muted}
      >
        <i
          className="fa-solid fa-volume-xmark"
          style={controls.muted ? { color: 'var(--brand)' } : undefined}
        />
      </button>

      <i className={`fa-solid ${volIcon(controls.vol)}`} />
      <input
        type="range"
        min={-20}
        max={20}
        value={controls.vol}
        aria-label="Volume"
        onChange={(e) =>
          updateControls(id, { vol: parseFloat(e.target.value) })
        }
      />

      <button
        className="track-button"
        onClick={() => updateControls(id, { pan: 0 })}
        title="Stereo pan (click to centre)"
        aria-label="Centre pan"
      >
        <i className="fa-solid fa-left-right" />
      </button>
      <input
        type="range"
        min={-1}
        max={1}
        step={0.1}
        value={controls.pan}
        aria-label="Pan"
        onChange={(e) =>
          updateControls(id, { pan: parseFloat(e.target.value) })
        }
      />
      {children}
    </div>
  );
}
