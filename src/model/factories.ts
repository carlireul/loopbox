import {
  defaultControls,
  defaultEffects,
  defaultEnvelope,
  defaultFilter,
  defaultNotes,
  defaultOscillator,
} from './defaults';
import { scaleRowCount } from './scale';
import type {
  AudioTrack,
  Project,
  SamplerTrack,
  Subdivision,
  SynthTrack,
  Track,
} from './types';

/** Generate a unique id. Replaces the legacy `uniqid` dependency. */
export function newId(): string {
  return crypto.randomUUID();
}

/** An empty step grid of `rows` × `cols`, all pads off. */
export function createSteps(rows: number, cols: number): boolean[][] {
  return Array.from({ length: rows }, () => Array<boolean>(cols).fill(false));
}

export function createSynthTrack(name = 'Untitled'): SynthTrack {
  const notes = defaultNotes();
  return {
    id: newId(),
    type: 'synth',
    name,
    controls: defaultControls(),
    effects: defaultEffects(),
    synth: {
      envelope: defaultEnvelope(),
      oscillator: defaultOscillator(),
      filter: defaultFilter(),
    },
    notes,
    steps: createSteps(scaleRowCount(notes.scale), notes.subdivision),
  };
}

export function createSamplerTrack(
  name: string,
  instruments: Record<string, string>,
  subdivision: Subdivision = 8,
): SamplerTrack {
  return {
    id: newId(),
    type: 'sampler',
    name,
    controls: defaultControls(),
    effects: defaultEffects(),
    subdivision,
    instruments,
    filter: defaultFilter(),
    steps: createSteps(Object.keys(instruments).length, subdivision),
  };
}

export function createAudioTrack(name: string, blob: Blob): AudioTrack {
  return {
    id: newId(),
    type: 'audio',
    name,
    controls: defaultControls(),
    effects: defaultEffects(),
    blob,
  };
}

export function createProject(name: string, trackIds: string[] = []): Project {
  return {
    id: newId(),
    name,
    bpm: 120,
    vol: -8,
    trackEnd: '1:0:0',
    trackIds,
  };
}

/** Type guards for narrowing a `Track` union. */
export const isSynthTrack = (t: Track): t is SynthTrack => t.type === 'synth';
export const isSamplerTrack = (t: Track): t is SamplerTrack =>
  t.type === 'sampler';
export const isAudioTrack = (t: Track): t is AudioTrack => t.type === 'audio';
