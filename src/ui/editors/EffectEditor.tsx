import { useProjectStore } from '../../store/projectStore';
import type { FilterType, Rolloff, Track } from '../../model/types';
import { FilterTutorial } from '../tutorials/FilterTutorial';
import { EffectTutorial } from '../tutorials/EffectTutorial';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const FILTER_TYPES: FilterType[] = ['highpass', 'lowpass'];
const ROLLOFFS: Rolloff[] = [-12, -24];
const LFO_RATES: Array<{ label: string; value: number | string }> = [
  { label: 'Off', value: 0 },
  { label: '2', value: '2n' },
  { label: '4', value: '4n' },
  { label: '8', value: '8n' },
  { label: '16', value: '16n' },
  { label: '32', value: '32n' },
];
const DELAY_TIMES = ['4n', '8n', '16n', '32n'];

const DEFAULT_EQ = {
  high: 0,
  highFrequency: 2500,
  low: 0,
  lowFrequency: 400,
  mid: 0,
};

/** Provides the filter that lives at a different path per track type. */
function filterOf(track: Track) {
  if (track.type === 'synth') return track.synth.filter;
  if (track.type === 'sampler') return track.filter;
  return undefined;
}

function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center gap-2">
      <span className="w-16">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <span className="w-8 text-right text-sm text-sky-700">{value}</span>
    </label>
  );
}

/** Filter, EQ, and toggleable effects (distortion / delay / reverb). */
export function EffectEditor({ id }: { id: string }) {
  const track = useProjectStore((s) => s.tracks[id]);
  const updateFilter = useProjectStore((s) => s.updateFilter);
  const toggleEffect = useProjectStore((s) => s.toggleEffect);
  const updateEffectOptions = useProjectStore((s) => s.updateEffectOptions);
  if (!track) return null;

  const filter = filterOf(track);
  const effects = track.effects;

  return (
    <div className="flex flex-col gap-4 pt-2">
      {filter && (
        <section className="flex flex-col gap-2 border-b border-gray-300 pb-3">
          <div className="flex items-center gap-2">
            <button
              className="btn-brand"
              onClick={() =>
                updateFilter(id, { wet: filter.wet === 1 ? 0 : 1 })
              }
            >
              {filter.wet === 1 ? 'Disable' : 'Enable'} Filter
            </button>
            <FilterTutorial id={id} />
          </div>
          <Slider
            label="Cutoff"
            min={0}
            max={2000}
            step={1}
            value={filter.cutoff}
            onChange={(v) => updateFilter(id, { cutoff: v })}
          />
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2">
              Type
              <select
                className="control"
                value={filter.type}
                onChange={(e) =>
                  updateFilter(id, { type: e.target.value as FilterType })
                }
              >
                {FILTER_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {capitalize(t)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              Rolloff
              <select
                className="control"
                value={filter.rolloff}
                onChange={(e) =>
                  updateFilter(id, {
                    rolloff: Number(e.target.value) as Rolloff,
                  })
                }
              >
                {ROLLOFFS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              LFO rate
              <select
                className="control"
                value={String(filter.rate)}
                onChange={(e) => {
                  const raw = e.target.value;
                  updateFilter(id, { rate: raw === '0' ? 0 : raw });
                }}
              >
                {LFO_RATES.map((r) => (
                  <option key={r.label} value={String(r.value)}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>
      )}

      <section className="flex flex-col gap-2 border-b border-gray-300 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">EQ</h4>
            <EffectTutorial />
          </div>
          <button
            className="btn-muted"
            onClick={() => updateEffectOptions(id, 'eq', DEFAULT_EQ)}
          >
            Reset
          </button>
        </div>
        {(['high', 'mid', 'low'] as const).map((band) => (
          <Slider
            key={band}
            label={capitalize(band)}
            min={-8}
            max={8}
            step={1}
            value={effects.eq.options[band]}
            onChange={(v) => updateEffectOptions(id, 'eq', { [band]: v })}
          />
        ))}
      </section>

      {(['distortion', 'delay', 'reverb'] as const).map((name) => (
        <section key={name} className="flex flex-col gap-2">
          <label className="flex items-center gap-2 font-semibold">
            <input
              type="checkbox"
              checked={effects[name].enabled}
              onChange={() => toggleEffect(id, name)}
            />
            {capitalize(name)}
          </label>
          <Slider
            label="Wet"
            min={0}
            max={1}
            step={0.1}
            value={effects[name].options.wet}
            onChange={(v) => updateEffectOptions(id, name, { wet: v })}
          />
          {name === 'distortion' && (
            <Slider
              label="Amount"
              min={0.1}
              max={1}
              step={0.1}
              value={effects.distortion.options.distortion}
              onChange={(v) =>
                updateEffectOptions(id, 'distortion', { distortion: v })
              }
            />
          )}
          {name === 'reverb' && (
            <Slider
              label="Decay"
              min={0.5}
              max={8}
              step={0.5}
              value={effects.reverb.options.decay}
              onChange={(v) => updateEffectOptions(id, 'reverb', { decay: v })}
            />
          )}
          {name === 'delay' && (
            <>
              <Slider
                label="Feedback"
                min={0}
                max={1}
                step={0.1}
                value={effects.delay.options.feedback}
                onChange={(v) =>
                  updateEffectOptions(id, 'delay', { feedback: v })
                }
              />
              <label className="flex items-center gap-2">
                <span className="w-16">Time</span>
                <select
                  className="control"
                  value={String(effects.delay.options.delayTime)}
                  onChange={(e) =>
                    updateEffectOptions(id, 'delay', {
                      delayTime: e.target.value,
                    })
                  }
                >
                  {DELAY_TIMES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
        </section>
      ))}
    </div>
  );
}
