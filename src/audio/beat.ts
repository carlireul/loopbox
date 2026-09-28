import type { Subdivision } from '../model/types';

/**
 * Tone.js transport position math, ported from the legacy `helpers.js`. A
 * position is "bars:quarters:sixteenths", e.g. "0:2:1". These are pure so the
 * sequencer timing can be unit-tested without an AudioContext.
 */

export function parsePosition(position: string): [number, number, number] {
  const [bars, quarters, sixteenths] = position
    .split(':')
    .map((n) => Math.floor(parseFloat(n)));
  return [bars, quarters, sixteenths];
}

/** Sixteenth index within the current bar (0–15). */
export function sixteenths(position: string): number {
  const [, quarters, sixteenth] = parsePosition(position);
  return sixteenth + 4 * quarters;
}

/** Eighth index within the current bar (0–7). */
export function eighths(position: string): number {
  return Math.floor(sixteenths(position) / 2);
}

/** Quarter index within the current bar (0–3). */
export function quarters(position: string): number {
  return parsePosition(position)[1];
}

/**
 * The active step index for a track at the given transport position, based on
 * its subdivision. Maps the shared 16th-note clock onto 4/8/16-step grids.
 */
export function getBeat(position: string, subdivision: Subdivision): number {
  switch (subdivision) {
    case 4:
      return quarters(position);
    case 8:
      return eighths(position);
    case 16:
      return sixteenths(position);
  }
}
