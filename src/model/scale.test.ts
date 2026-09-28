import { describe, expect, it } from 'vitest';
import { scaleNotes, scalePitches, scaleRowCount } from './scale';

describe('scale helpers', () => {
  it('returns the 7 pitches of a major scale, simplified', () => {
    expect(scalePitches('C major')).toEqual([
      'C',
      'D',
      'E',
      'F',
      'G',
      'A',
      'B',
    ]);
  });

  it('appends the octave to produce concrete notes', () => {
    expect(scaleNotes('C major', 4)).toEqual([
      'C4',
      'D4',
      'E4',
      'F4',
      'G4',
      'A4',
      'B4',
    ]);
  });

  it('reports the row count for a scale', () => {
    expect(scaleRowCount('C major')).toBe(7);
    expect(scaleRowCount('C major pentatonic')).toBe(5);
  });
});
