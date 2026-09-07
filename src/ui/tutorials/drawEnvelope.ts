import type { Envelope } from '../../model/types';

const BRAND = '#74C0FC';
const BG = '#0f172a';
const GRID = 'rgba(148, 197, 252, 0.08)';
const BASELINE = 'rgba(255, 255, 255, 0.18)';
const DIVIDER = 'rgba(255, 255, 255, 0.14)';
const LABEL = 'rgba(226, 232, 240, 0.85)';
const SUBLABEL = 'rgba(148, 163, 184, 0.7)';

const PAD_X = 20;
const TOP = 34; // peak (max amplitude) line
const BASE_OFFSET = 52; // room below the silence line for labels
const SUSTAIN_UNITS = 0.55; // fixed width of the sustain hold
/** Max total units (attack + decay + sustain hold + release at their maxima). */
const MAX_UNITS = 2 / 2 + 2 / 2 + SUSTAIN_UNITS + 5 / 5;

/** Pixel radius (canvas space) within which a pointer grabs a handle. */
export const HIT_RADIUS = 26;

export type HandleId = 'peak' | 'corner' | 'end';

export interface EnvelopeGeometry {
  top: number;
  base: number;
  x0: number;
  xA: number;
  xD: number;
  xS: number;
  xR: number;
  sustainY: number;
  /** Pixels per envelope "unit" (fixed, so a handle maps to one parameter). */
  k: number;
  handles: Array<{ id: HandleId; x: number; y: number }>;
}

/** Compute handle/segment positions for a canvas of size W×H. */
export function envelopeGeometry(
  W: number,
  H: number,
  env: Envelope,
): EnvelopeGeometry {
  const top = TOP;
  const base = H - BASE_OFFSET;
  const k = (W - PAD_X * 2) / MAX_UNITS;

  const x0 = PAD_X;
  const xA = x0 + (env.attack / 2) * k;
  const xD = xA + (env.decay / 2) * k;
  const xS = xD + SUSTAIN_UNITS * k;
  const xR = xS + (env.release / 5) * k;
  const sustainY = top + (base - top) * (1 - env.sustain);

  return {
    top,
    base,
    x0,
    xA,
    xD,
    xS,
    xR,
    sustainY,
    k,
    handles: [
      { id: 'peak', x: xA, y: top },
      { id: 'corner', x: xD, y: sustainY },
      { id: 'end', x: xR, y: base },
    ],
  };
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));
// Snap to the 0.05 grid and clear binary-float noise (e.g. 4.800000000001).
export const snap = (v: number) => Math.round(v / 0.05) / 20;

/**
 * Given a handle being dragged to canvas point (px, py), return the envelope
 * fields it controls. Other segments' anchors stay fixed during a drag, so each
 * handle maps to its own parameter(s): peak→attack, corner→decay+sustain,
 * end→release.
 */
export function handleDragToEnvelope(
  id: HandleId,
  px: number,
  py: number,
  geo: EnvelopeGeometry,
): Partial<Envelope> {
  const { x0, xA, xS, k, top, base } = geo;
  switch (id) {
    case 'peak':
      return { attack: snap(clamp(((px - x0) / k) * 2, 0, 2)) };
    case 'corner':
      return {
        decay: snap(clamp(((px - xA) / k) * 2, 0.1, 2)),
        sustain: snap(clamp(1 - (py - top) / (base - top), 0, 1)),
      };
    case 'end':
      return { release: snap(clamp(((px - xS) / k) * 5, 0, 5)) };
  }
}

const LETTERS = ['A', 'D', 'S', 'R'];

/** Format a param value for display: at most 2 decimals, no float noise. */
export const fmt = (v: number) => String(parseFloat(v.toFixed(2)));

/**
 * Draw an ADSR envelope as a filled brand curve on a dark panel: attack ramp to
 * the peak, decay to the sustain level, a sustain hold, then release to silence.
 * `active` highlights the handle currently hovered or dragged. Rendered at 2×
 * and scaled down by CSS for crisp lines.
 */
export function drawEnvelope(
  ctx: CanvasRenderingContext2D,
  env: Envelope,
  active?: HandleId | null,
): void {
  const { width: W, height: H } = ctx.canvas;
  const geo = envelopeGeometry(W, H, env);
  const { top, base, x0, xA, xD, xS, xR, sustainY, handles } = geo;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // Horizontal grid + silence baseline.
  ctx.lineWidth = 2;
  ctx.strokeStyle = GRID;
  for (let i = 1; i <= 3; i++) {
    const y = top + ((base - top) * i) / 4;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(W - PAD_X, y);
    ctx.stroke();
  }
  ctx.strokeStyle = BASELINE;
  ctx.beginPath();
  ctx.moveTo(x0, base);
  ctx.lineTo(W - PAD_X, base);
  ctx.stroke();

  const pts: Array<[number, number]> = [
    [x0, base],
    [xA, top],
    [xD, sustainY],
    [xS, sustainY],
    [xR, base],
  ];

  // Stage dividers.
  ctx.setLineDash([4, 6]);
  ctx.strokeStyle = DIVIDER;
  ctx.lineWidth = 1.5;
  for (const x of [xA, xD, xS]) {
    ctx.beginPath();
    ctx.moveTo(x, top - 8);
    ctx.lineTo(x, base);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Filled area under the curve.
  const fill = ctx.createLinearGradient(0, top, 0, base);
  fill.addColorStop(0, 'rgba(116, 192, 252, 0.38)');
  fill.addColorStop(1, 'rgba(116, 192, 252, 0.03)');
  ctx.beginPath();
  ctx.moveTo(x0, base);
  for (const [x, y] of pts) ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();

  // Curve line with a soft glow.
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (const [x, y] of pts.slice(1)) ctx.lineTo(x, y);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = 4;
  ctx.strokeStyle = BRAND;
  ctx.shadowColor = 'rgba(116, 192, 252, 0.6)';
  ctx.shadowBlur = 12;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Draggable handles.
  for (const h of handles) {
    const r = active === h.id ? 9 : 6;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
    ctx.fillStyle = active === h.id ? BRAND : BG;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = BRAND;
    ctx.stroke();
  }

  // Stage labels (letter + value) centred under each segment.
  const centers: Array<[number, number]> = [
    [x0 + (xA - x0) / 2, env.attack],
    [xA + (xD - xA) / 2, env.decay],
    [xD + (xS - xD) / 2, env.sustain],
    [xS + (xR - xS) / 2, env.release],
  ];
  ctx.textAlign = 'center';
  centers.forEach(([cx, value], i) => {
    ctx.fillStyle = LABEL;
    ctx.font = '600 20px system-ui, sans-serif';
    ctx.fillText(LETTERS[i], cx, base + 24);
    ctx.fillStyle = SUBLABEL;
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText(fmt(value), cx, base + 42);
  });
}
