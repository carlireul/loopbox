import { describe, expect, it } from 'vitest';
import { resizeSteps } from './steps';

describe('resizeSteps', () => {
  it('preserves pads that stay within the new bounds', () => {
    const steps = [
      [true, false, true],
      [false, true, false],
    ];
    expect(resizeSteps(steps, 2, 3)).toEqual(steps);
  });

  it('grows the grid with new pads off', () => {
    const steps = [[true, false]];
    expect(resizeSteps(steps, 2, 4)).toEqual([
      [true, false, false, false],
      [false, false, false, false],
    ]);
  });

  it('shrinks the grid, dropping out-of-bounds pads', () => {
    const steps = [
      [true, true, true, true],
      [true, true, true, true],
    ];
    expect(resizeSteps(steps, 1, 2)).toEqual([[true, true]]);
  });

  it('does not mutate the input', () => {
    const steps = [[true]];
    resizeSteps(steps, 2, 2);
    expect(steps).toEqual([[true]]);
  });
});
