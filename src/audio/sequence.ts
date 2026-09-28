import type { Steps, Subdivision, Track } from '../model/types';
import { scaleNotes } from '../model/scale';

/**
 * The row labels a track's step grid maps onto: note names for a synth
 * (e.g. "C4"), instrument keys for a sampler. Row `i` of the grid corresponds
 * to `labels[i]`.
 */
export function labelsFor(track: Track): string[] {
  switch (track.type) {
    case 'synth':
      return scaleNotes(track.notes.scale, track.notes.octave);
    case 'sampler':
      return Object.keys(track.instruments);
    case 'audio':
      return [];
  }
}

/** A track's active subdivision, regardless of where it is stored. */
export function subdivisionOf(track: Track): Subdivision | undefined {
  if (track.type === 'synth') return track.notes.subdivision;
  if (track.type === 'sampler') return track.subdivision;
  return undefined;
}

/**
 * Invert a step grid into a per-step list of labels to trigger:
 * `triggerMap[stepIndex]` is every note/sample active on that step. This is
 * what the scheduler reads on each tick. Ported from the legacy `notesArray`
 * effect that lived in every track component.
 */
export function stepsToTriggerMap(
  steps: Steps,
  labels: string[],
  subdivision: Subdivision,
): string[][] {
  const map: string[][] = Array.from({ length: subdivision }, () => []);
  steps.forEach((row, rowIndex) => {
    const label = labels[rowIndex];
    if (label == null) return;
    row.forEach((on, stepIndex) => {
      if (on && stepIndex < subdivision) map[stepIndex].push(label);
    });
  });
  return map;
}

/** Convenience: build a track's trigger map directly from its state. */
export function triggerMapFor(track: Track): string[][] {
  const subdivision = subdivisionOf(track);
  if (subdivision === undefined || !('steps' in track)) return [];
  return stepsToTriggerMap(track.steps, labelsFor(track), subdivision);
}
