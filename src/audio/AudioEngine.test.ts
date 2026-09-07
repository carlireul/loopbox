import { beforeEach, describe, expect, it, vi } from 'vitest';

interface FakeVoice {
  id: string;
  sync: ReturnType<typeof vi.fn>;
  tick: ReturnType<typeof vi.fn>;
  getLevel: ReturnType<typeof vi.fn>;
  dispose: ReturnType<typeof vi.fn>;
}

// The voice layer touches Tone.js (and thus an AudioContext), which jsdom does
// not provide. Mock it so we can unit-test the engine's reconciliation and
// subscription bookkeeping in isolation.
const { registry } = vi.hoisted(() => ({ registry: [] as FakeVoice[] }));

vi.mock('./voices', () => ({
  createVoice: (track: { id: string }) => {
    const voice = {
      id: track.id,
      sync: vi.fn(),
      tick: vi.fn(),
      getLevel: vi.fn(() => 0.42),
      dispose: vi.fn(),
    };
    registry.push(voice);
    return voice;
  },
}));

import { AudioEngine } from './AudioEngine';
import type { Track } from '../model/types';

const track = (id: string): Track =>
  ({ id, type: 'synth' }) as unknown as Track;
const find = (id: string) => registry.find((v) => v.id === id)!;

let engine: AudioEngine;

beforeEach(() => {
  registry.length = 0;
  engine = new AudioEngine();
});

describe('setTracks reconciliation', () => {
  it('creates a voice for each new track', () => {
    engine.setTracks({ a: track('a'), b: track('b') });
    expect(registry).toHaveLength(2);
  });

  it('syncs existing voices instead of recreating them', () => {
    engine.setTracks({ a: track('a') });
    engine.setTracks({ a: track('a') });
    expect(registry).toHaveLength(1);
    expect(find('a').sync).toHaveBeenCalledTimes(1);
  });

  it('disposes voices whose tracks were removed', () => {
    engine.setTracks({ a: track('a'), b: track('b') });
    engine.setTracks({ a: track('a') });
    expect(find('b').dispose).toHaveBeenCalledOnce();
  });
});

describe('level readout', () => {
  it('reads the level from the matching voice', () => {
    engine.setTracks({ a: track('a') });
    expect(engine.getLevel('a')).toBe(0.42);
  });
  it('returns 0 for an unknown track', () => {
    expect(engine.getLevel('nope')).toBe(0);
  });
});

describe('subscriptions', () => {
  it('adds and removes draw listeners via the returned unsubscribe', () => {
    const listener = vi.fn();
    const unsubscribe = engine.onDraw(listener);
    expect(typeof unsubscribe).toBe('function');
    unsubscribe(); // should not throw
  });
});

describe('dispose', () => {
  it('disposes all voices and clears them', () => {
    engine.setTracks({ a: track('a'), b: track('b') });
    const [a, b] = [find('a'), find('b')];
    engine.dispose();
    expect(a.dispose).toHaveBeenCalledOnce();
    expect(b.dispose).toHaveBeenCalledOnce();
    expect(engine.getLevel('a')).toBe(0);
  });
});
