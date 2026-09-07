import { useEffect, useRef, useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import type { Envelope } from '../../model/types';
import { Renamable } from '../common/Renamable';
import { Modal, TutorialButton } from '../common/Modal';
import { Visualizer } from './Visualizer';
import {
  drawEnvelope,
  envelopeGeometry,
  handleDragToEnvelope,
  HIT_RADIUS,
  fmt,
  snap,
  type HandleId,
} from './drawEnvelope';

const ROWS: Array<{ key: keyof Envelope; label: string; max: number }> = [
  { key: 'attack', label: 'Attack', max: 2 },
  { key: 'decay', label: 'Decay', max: 2 },
  { key: 'sustain', label: 'Sustain', max: 1 },
  { key: 'release', label: 'Release', max: 5 },
];

/** Explains the ADSR envelope with a live shape drawing and amplitude meter. */
export function ADSRTutorial({ id }: { id: string }) {
  const envelope = useProjectStore((s) => {
    const t = s.tracks[id];
    return t?.type === 'synth' ? t.synth.envelope : undefined;
  });
  const solod = useProjectStore((s) => s.tracks[id]?.controls.solod);
  const updateEnvelope = useProjectStore((s) => s.updateEnvelope);
  const toggleSolo = useProjectStore((s) => s.toggleSolo);

  const [open, setOpen] = useState(false);
  const [showText, setShowText] = useState(true);
  const [active, setActive] = useState<HandleId | null>(null);
  const savedRef = useRef<Envelope | undefined>(undefined);
  const draggingRef = useRef<HandleId | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleOpen = () => {
    if (envelope) savedRef.current = { ...envelope };
    setOpen(true);
  };

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && envelope) drawEnvelope(ctx, envelope, active);
  }, [open, envelope, active]);

  if (!envelope) return null;

  const reset = () => savedRef.current && updateEnvelope(id, savedRef.current);

  /** Pointer position mapped into the canvas's internal coordinate space. */
  const canvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * canvas.width) / rect.width,
      y: ((e.clientY - rect.top) * canvas.height) / rect.height,
    };
  };

  const handleAt = (x: number, y: number): HandleId | null => {
    const canvas = canvasRef.current!;
    const geo = envelopeGeometry(canvas.width, canvas.height, envelope);
    for (const h of geo.handles) {
      if (Math.hypot(h.x - x, h.y - y) <= HIT_RADIUS) return h.id;
    }
    return null;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = canvasPoint(e);
    const hit = handleAt(x, y);
    if (!hit) return;
    draggingRef.current = hit;
    setActive(hit);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = canvasPoint(e);
    const dragging = draggingRef.current;
    if (!dragging) {
      setActive(handleAt(x, y));
      return;
    }
    const canvas = canvasRef.current!;
    const geo = envelopeGeometry(canvas.width, canvas.height, envelope);
    updateEnvelope(id, handleDragToEnvelope(dragging, x, y, geo));
  };

  const endDrag = () => {
    draggingRef.current = null;
    setActive(null);
  };

  return (
    <>
      <TutorialButton onClick={handleOpen} label="ADSR tutorial" />
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="ADSR Envelope"
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
          <div className="flex flex-wrap items-end gap-3">
            <canvas
              ref={canvasRef}
              height={480}
              width={1120}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onPointerLeave={() => !draggingRef.current && setActive(null)}
              className="max-w-full flex-1 touch-none select-none rounded-lg"
              style={{
                cursor: draggingRef.current
                  ? 'grabbing'
                  : active
                    ? 'grab'
                    : 'default',
              }}
            />
            <Visualizer trackId={id} />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ROWS.map(({ key, label, max }) => (
              <div className="flex flex-col gap-1" key={key}>
                <span className="flex items-center gap-2">
                  {label}
                  <Renamable
                    number
                    min={0}
                    max={max}
                    step={0.05}
                    name={fmt(envelope[key])}
                    onChange={(v) =>
                      updateEnvelope(id, { [key]: snap(parseFloat(v)) })
                    }
                  />
                </span>
                <input
                  type="range"
                  min={key === 'decay' ? 0.1 : 0}
                  max={max}
                  step={0.05}
                  value={envelope[key]}
                  aria-label={label}
                  onChange={(e) =>
                    updateEnvelope(id, {
                      [key]: snap(parseFloat(e.target.value)),
                    })
                  }
                />
              </div>
            ))}
          </div>

          {showText && (
            <div className="flex flex-col gap-2">
              <p>
                <b>Envelopes</b> control how a sound changes over time. ADSR
                changes the volume (amplitude) of the synth when a key is
                pressed. The graph shows volume (Y) over time (X).
              </p>
              <p>
                <b>Attack</b> controls how quickly a sound goes from silence to
                its loudest peak. A short attack is plucky; a long attack is
                smooth and atmospheric.
              </p>
              <p>
                <b>Decay</b> and <b>Sustain</b> are linked. Sustain is the level
                held after the initial peak; Decay is how quickly it falls to
                that level. At max sustain, decay does nothing.
              </p>
              <p>
                <b>Release</b> controls how long a sound takes to fade to
                silence after the key is released.
              </p>
              <ul className="list-disc pl-6">
                <li>
                  It&apos;s easier to hear the stages with a longer note — try a
                  quarter note.
                </li>
                <li>Play with extreme values to hear the effect.</li>
                <li>Notice how the envelope drives the amplitude meter.</li>
              </ul>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
