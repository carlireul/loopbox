import type { Steps } from './types';

/**
 * Resize a step grid to `rows` × `cols`, preserving any pads that still fall
 * within the new bounds. Used when the scale (row count) or subdivision (column
 * count) changes.
 *
 * The legacy app cleared the whole grid on a subdivision change; preserving the
 * overlap is a deliberate UX improvement, not a regression.
 */
export function resizeSteps(steps: Steps, rows: number, cols: number): Steps {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => steps[r]?.[c] ?? false),
  );
}
