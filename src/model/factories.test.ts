import { describe, expect, it } from 'vitest';
import {
  createAudioTrack,
  createProject,
  createSamplerTrack,
  createSynthTrack,
  createSteps,
  isSamplerTrack,
  isSynthTrack,
  newId,
} from './factories';

describe('createSteps', () => {
  it('builds a rows × cols grid of false', () => {
    expect(createSteps(2, 3)).toEqual([
      [false, false, false],
      [false, false, false],
    ]);
  });
});

describe('newId', () => {
  it('generates unique ids', () => {
    expect(newId()).not.toBe(newId());
  });
});

describe('createSynthTrack', () => {
  it('sizes the step grid to the scale and subdivision', () => {
    const t = createSynthTrack();
    expect(t.type).toBe('synth');
    expect(t.steps).toHaveLength(7); // C major
    expect(t.steps[0]).toHaveLength(8); // default subdivision
    expect(isSynthTrack(t)).toBe(true);
  });

  it('starts with all effects disabled', () => {
    const t = createSynthTrack();
    expect(t.effects.reverb.enabled).toBe(false);
    expect(t.effects.delay.enabled).toBe(false);
  });
});

describe('createSamplerTrack', () => {
  it('sizes the step grid to the number of instruments', () => {
    const t = createSamplerTrack('Kit', { kick: 'a.wav', snare: 'b.wav' });
    expect(isSamplerTrack(t)).toBe(true);
    expect(t.steps).toHaveLength(2);
    expect(t.steps[0]).toHaveLength(8);
  });
});

describe('createAudioTrack', () => {
  it('keeps the blob and derives no steps', () => {
    const blob = new Blob(['x'], { type: 'audio/wav' });
    const t = createAudioTrack('clip', blob);
    expect(t.type).toBe('audio');
    expect(t.blob).toBe(blob);
    expect('steps' in t).toBe(false);
  });
});

describe('createProject', () => {
  it('defaults bpm/vol and stores the track ordering', () => {
    const p = createProject('My Song', ['a', 'b']);
    expect(p.bpm).toBe(120);
    expect(p.vol).toBe(-8);
    expect(p.trackEnd).toBe('1:0:0');
    expect(p.trackIds).toEqual(['a', 'b']);
  });
});
