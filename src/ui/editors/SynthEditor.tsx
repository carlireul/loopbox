import { useProjectStore, type SynthTrack } from '../../store/projectStore';
import type { Envelope, OscillatorType } from '../../model/types';
import { Renamable } from '../common/Renamable';

const WAVES: OscillatorType[] = ['sine', 'square', 'sawtooth', 'triangle'];
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

interface EnvRow {
  key: keyof Envelope;
  label: string;
  min: number;
  max: number;
}
const ENV_ROWS: EnvRow[] = [
  { key: 'attack', label: 'Attack', min: 0, max: 2 },
  { key: 'decay', label: 'Decay', min: 0.1, max: 2 },
  { key: 'sustain', label: 'Sustain', min: 0, max: 1 },
  { key: 'release', label: 'Release', min: 0, max: 5 },
];

/** Oscillator type + ADSR envelope for a synth track. */
export function SynthEditor({ track }: { track: SynthTrack }) {
  const setOscillatorType = useProjectStore((s) => s.setOscillatorType);
  const updateEnvelope = useProjectStore((s) => s.updateEnvelope);
  const { id } = track;

  return (
    <div className="flex flex-col gap-3 border-b border-gray-300 pb-4">
      <label className="flex items-center gap-2">
        <span>Wave type</span>
        <select
          className="control"
          value={track.synth.oscillator.type}
          onChange={(e) =>
            setOscillatorType(id, e.target.value as OscillatorType)
          }
        >
          {WAVES.map((w) => (
            <option key={w} value={w}>
              {capitalize(w)}
            </option>
          ))}
        </select>
      </label>

      {ENV_ROWS.map(({ key, label, min, max }) => (
        <div className="flex items-center gap-2" key={key}>
          <span className="w-16">{label}</span>
          <input
            type="range"
            min={min}
            max={max}
            step={0.05}
            value={track.synth.envelope[key]}
            aria-label={label}
            onChange={(e) =>
              updateEnvelope(id, { [key]: parseFloat(e.target.value) })
            }
          />
          <Renamable
            number
            min={min}
            max={max}
            step={0.05}
            name={track.synth.envelope[key]}
            onChange={(v) => updateEnvelope(id, { [key]: parseFloat(v) })}
          />
        </div>
      ))}
    </div>
  );
}
