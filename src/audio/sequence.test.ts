import { describe, expect, it } from 'vitest';
import { labelsFor, stepsToTriggerMap, triggerMapFor } from './sequence';
import { createSamplerTrack, createSynthTrack } from '../model/factories';

describe('labelsFor', () => {
  it('returns scale notes for a synth', () => {
    const synth = createSynthTrack();
    expect(labelsFor(synth)).toEqual([
      'C4',
      'D4',
      'E4',
      'F4',
      'G4',
      'A4',
      'B4',
    ]);
  });

  it('returns instrument keys for a sampler', () => {
    const sampler = createSamplerTrack('Kit', {
      kick: 'k.wav',
      snare: 's.wav',
    });
    expect(labelsFor(sampler)).toEqual(['kick', 'snare']);
  });
});

describe('stepsToTriggerMap', () => {
  it('inverts a grid into per-step trigger lists', () => {
    // rows: C, D, E ; 4 steps
    const steps = [
      [true, false, false, false], // C on step 0
      [false, true, false, false], // D on step 1
      [true, false, false, true], // E on steps 0 and 3
    ];
    const labels = ['C4', 'D4', 'E4'];
    expect(stepsToTriggerMap(steps, labels, 4)).toEqual([
      ['C4', 'E4'],
      ['D4'],
      [],
      ['E4'],
    ]);
  });

  it('ignores rows without a matching label', () => {
    const steps = [
      [true, false, false, false],
      [true, false, false, false], // no label for this row
    ];
    expect(stepsToTriggerMap(steps, ['kick'], 4)).toEqual([
      ['kick'],
      [],
      [],
      [],
    ]);
  });
});

describe('triggerMapFor', () => {
  it('builds a map sized to the track subdivision', () => {
    const synth = createSynthTrack();
    const map = triggerMapFor(synth);
    expect(map).toHaveLength(8); // default subdivision
    expect(map.every((step) => Array.isArray(step))).toBe(true);
  });

  it('returns empty for an audio track', () => {
    const blob = new Blob(['x']);
    // audio tracks have no steps
    const audio = { type: 'audio' as const, blob } as never;
    expect(triggerMapFor(audio)).toEqual([]);
  });
});
