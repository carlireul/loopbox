/**
 * Domain model for loopbox.
 *
 * Replaces the untyped, deeply-nested state object from the legacy app. `Track`
 * is a discriminated union on `type`, which is what lets the store expose typed
 * actions instead of the old 380-line `useTrack` `switch(type)` hook.
 */

// --- primitives -------------------------------------------------------------

export type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle';

export type FilterType =
  'highpass' | 'lowpass' | 'bandpass' | 'notch' | 'allpass';

/** Tone.js filter rolloff, in dB/octave. */
export type Rolloff = -12 | -24 | -48 | -96;

/** Number of sequencer steps per bar. */
export type Subdivision = 4 | 8 | 16;

/** Tonal scale name, e.g. "C major". */
export type ScaleName = string;

/**
 * A step grid: one row per note/instrument, one boolean per step.
 * `steps[noteIndex][stepIndex]` is true when that pad is active.
 */
export type Steps = boolean[][];

// --- shared shapes ----------------------------------------------------------

export interface Controls {
  muted: boolean;
  /** Volume in dB. */
  vol: number;
  solod: boolean;
  /** Stereo pan, -1 (left) to 1 (right). */
  pan: number;
}

export interface Envelope {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export interface Oscillator {
  type: OscillatorType;
}

export interface Filter {
  /** Dry/wet mix, 0–1. Also used as the on/off toggle in the UI. */
  wet: number;
  cutoff: number;
  type: FilterType;
  /** AutoFilter LFO rate. */
  rate: number;
  rolloff: Rolloff;
}

export interface Notes {
  scale: ScaleName;
  subdivision: Subdivision;
  octave: number;
}

// --- effects ----------------------------------------------------------------

export interface EQOptions {
  high: number;
  highFrequency: number;
  low: number;
  lowFrequency: number;
  mid: number;
}

export interface ReverbOptions {
  wet: number;
  decay: number;
}

export interface DelayOptions {
  wet: number;
  /** Tone.js time value — seconds (number) or notation like "8n" (string). */
  delayTime: number | string;
  feedback: number;
}

export interface DistortionOptions {
  wet: number;
  distortion: number;
}

export interface Effect<O> {
  enabled: boolean;
  options: O;
}

export interface Effects {
  eq: Effect<EQOptions>;
  reverb: Effect<ReverbOptions>;
  delay: Effect<DelayOptions>;
  distortion: Effect<DistortionOptions>;
}

/** Names of the toggleable effects, useful for iterating. */
export type EffectName = keyof Effects;

// --- tracks -----------------------------------------------------------------

export type TrackType = 'synth' | 'sampler' | 'audio';

interface TrackBase {
  id: string;
  type: TrackType;
  name: string;
  controls: Controls;
  effects: Effects;
}

export interface SynthTrack extends TrackBase {
  type: 'synth';
  synth: {
    envelope: Envelope;
    oscillator: Oscillator;
    filter: Filter;
  };
  notes: Notes;
  steps: Steps;
}

export interface SamplerTrack extends TrackBase {
  type: 'sampler';
  subdivision: Subdivision;
  /** Map of instrument name → audio source URL. */
  instruments: Record<string, string>;
  filter: Filter;
  steps: Steps;
}

export interface AudioTrack extends TrackBase {
  type: 'audio';
  /** Persisted audio data. The playable object URL is derived at load time. */
  blob: Blob;
}

export type Track = SynthTrack | SamplerTrack | AudioTrack;

// --- project ----------------------------------------------------------------

export interface Project {
  id: string;
  name: string;
  /** Beats per minute. */
  bpm: number;
  /** Master volume in dB. */
  vol: number;
  /** Loop end position in bars:beats:sixteenths, e.g. "1:0:0". */
  trackEnd: string;
  /** Ordered track ids belonging to this project. */
  trackIds: string[];
}

// --- sample library ---------------------------------------------------------

export interface Sample {
  id?: number;
  sampleType: string;
  pack: string;
  name: string;
  source: string;
}
