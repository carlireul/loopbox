import { Note, Scale } from 'tonal';
import type { ScaleName } from './types';

/**
 * The pitch classes of a scale, simplified (e.g. "C#" not "Db"), without an
 * octave. Ported from the legacy `useTrack.getNotes` logic.
 */
export function scalePitches(scale: ScaleName): string[] {
  return Scale.get(scale).notes.map((n) => Note.simplify(n));
}

/**
 * Concrete notes for a scale at a given octave, e.g. ["C4", "D4", ...].
 * This is the ordered set the sequencer rows map onto.
 */
export function scaleNotes(scale: ScaleName, octave: number): string[] {
  return scalePitches(scale).map((pitch) => `${pitch}${octave}`);
}

/** Number of sequencer rows a synth scale needs. */
export function scaleRowCount(scale: ScaleName): number {
  return scalePitches(scale).length;
}
