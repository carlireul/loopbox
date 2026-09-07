import { useEffect, useRef, useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import type { Filter, FilterType, Rolloff } from '../../model/types';
import { lfoWavelength } from '../../audio/demos';
import { SineWaveGenerator } from '../../services/sine-wave-generator';
import { Modal, TutorialButton } from '../common/Modal';

const LFO_RATES: Array<{ label: string; value: number | string }> = [
  { label: 'Off', value: 0 },
  { label: '2', value: '2n' },
  { label: '4', value: '4n' },
  { label: '8', value: '8n' },
  { label: '16', value: '16n' },
  { label: '32', value: '32n' },
];
const rateLabel = (rate: Filter['rate']) =>
  rate === 0 ? 'Off' : `1/${String(rate).split('n')[0]}`;

/** Explains the autofilter with a live frequency-response curve and LFO wave. */
export function FilterTutorial({ id }: { id: string }) {
  const filter = useProjectStore((s) => {
    const t = s.tracks[id];
    if (t?.type === 'synth') return t.synth.filter;
    if (t?.type === 'sampler') return t.filter;
    return undefined;
  });
  const solod = useProjectStore((s) => s.tracks[id]?.controls.solod);
  const updateFilter = useProjectStore((s) => s.updateFilter);
  const toggleSolo = useProjectStore((s) => s.toggleSolo);

  const [open, setOpen] = useState(false);
  const [showText, setShowText] = useState(true);
  const savedRef = useRef<Filter | undefined>(undefined);
  const curveRef = useRef<HTMLCanvasElement>(null);
  const waveRef = useRef<HTMLCanvasElement>(null);
  const genRef = useRef<SineWaveGenerator | null>(null);

  const handleOpen = () => {
    if (filter) savedRef.current = { ...filter };
    setOpen(true);
  };

  // Animated LFO wave.
  useEffect(() => {
    if (!open || !waveRef.current || !filter) return;
    const gen = new SineWaveGenerator({ el: waveRef.current });
    gen.addWave({
      amplitude: 33,
      wavelength: lfoWavelength(filter.rate),
      strokeStyle: 'rgba(116,192,252,0.6)',
      speed: 0.5,
    });
    gen.start();
    genRef.current = gen;
    return () => {
      gen.stop();
      genRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    const wave = genRef.current?.waves[0];
    if (wave && filter) wave.wavelength = lfoWavelength(filter.rate);
  }, [filter]);

  // Frequency-response curve.
  useEffect(() => {
    const canvas = curveRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !filter) return;
    const cutoff = filter.cutoff / 10;
    const angle = filter.rolloff === -24 ? 10 : 50;
    const mid = canvas.height / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#74C0FC';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (filter.type === 'highpass') {
      ctx.moveTo(cutoff - angle, canvas.height);
      ctx.arcTo(cutoff, mid, canvas.width, mid + 10, 30);
      ctx.lineTo(canvas.width, mid);
    } else {
      ctx.moveTo(cutoff + angle, canvas.height);
      ctx.arcTo(cutoff > 50 ? cutoff : 0, mid, 0, mid, 30);
      ctx.lineTo(0, mid);
    }
    ctx.stroke();
  }, [open, filter]);

  if (!filter) return null;

  const reset = () => savedRef.current && updateFilter(id, savedRef.current);

  return (
    <>
      <TutorialButton onClick={handleOpen} label="Filter tutorial" />
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Autofilter"
        actions={
          <>
            <button
              className="track-button"
              onClick={() => toggleSolo(id)}
              aria-label="Solo"
            >
              <i
                className="fa-solid fa-headphones"
                style={solod ? { color: 'var(--brand)' } : undefined}
              />
            </button>
            <button
              className="btn-muted"
              onClick={() => setShowText((p) => !p)}
            >
              {showText ? 'Hide' : 'Show'} Text
            </button>
            <button className="btn-muted" onClick={reset}>
              Reset
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-3 leading-relaxed">
          <div className="flex flex-wrap gap-3">
            <canvas
              ref={curveRef}
              height={200}
              width={300}
              className="rounded bg-gray-100"
            />
            <canvas
              ref={waveRef}
              height={200}
              width={300}
              className="flex-1 rounded bg-gray-800"
            />
          </div>

          <label className="flex items-center gap-2">
            <span className="w-16">Cutoff</span>
            <input
              type="range"
              min={0}
              max={2000}
              step={1}
              value={filter.cutoff}
              aria-label="Cutoff"
              onChange={(e) =>
                updateFilter(id, { cutoff: parseFloat(e.target.value) })
              }
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <button
              className="btn-brand"
              onClick={() =>
                updateFilter(id, { wet: filter.wet === 1 ? 0 : 1 })
              }
            >
              {filter.wet === 1 ? 'Disable' : 'Enable'} Filter
            </button>
            <label className="flex items-center gap-1">
              Type
              <select
                className="control"
                value={filter.type}
                onChange={(e) =>
                  updateFilter(id, { type: e.target.value as FilterType })
                }
              >
                <option value="highpass">Highpass</option>
                <option value="lowpass">Lowpass</option>
              </select>
            </label>
            <label className="flex items-center gap-1">
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
                <option value={-12}>-12</option>
                <option value={-24}>-24</option>
              </select>
            </label>
            <label className="flex items-center gap-1">
              LFO Rate
              <select
                className="control"
                value={String(filter.rate)}
                aria-label={`LFO Rate ${rateLabel(filter.rate)}`}
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

          {showText && (
            <div className="flex flex-col gap-2">
              <p>Filters cut out certain frequencies of a sound.</p>
              <p>
                A <b>highpass</b> filter only lets through frequencies{' '}
                <b>above</b> the cutoff; a <b>lowpass</b> filter only those{' '}
                <b>below</b> it. The curve shows what passes through — anything
                outside it is filtered out.
              </p>
              <p>
                The <b>rolloff</b> (in dB) controls how quickly the sound tapers
                off past the cutoff.
              </p>
              <p>
                An autofilter is a filter driven by an LFO (
                <b>low-frequency oscillator</b>) that modulates around the
                cutoff for a wobbly effect, synced to the beat. The animation
                shows the LFO&apos;s rate.
              </p>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
