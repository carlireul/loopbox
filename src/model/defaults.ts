import type { Controls, Effects, Filter, Notes, Oscillator } from './types';

/** Default channel controls for a new track. */
export const defaultControls = (): Controls => ({
  muted: false,
  vol: -8,
  solod: false,
  pan: 0,
});

/** All effects off, with sensible starting options. */
export const defaultEffects = (): Effects => ({
  eq: {
    enabled: false,
    options: {
      high: 0,
      highFrequency: 2500,
      low: 0,
      lowFrequency: 400,
      mid: 0,
    },
  },
  reverb: {
    enabled: false,
    options: { wet: 0.5, decay: 1 },
  },
  delay: {
    enabled: false,
    options: { wet: 0.5, delayTime: '8n', feedback: 0 },
  },
  distortion: {
    enabled: false,
    options: { wet: 0.5, distortion: 0.2 },
  },
});

/** Default (disabled) filter shared by synth and sampler tracks. */
export const defaultFilter = (): Filter => ({
  wet: 0,
  cutoff: 0,
  type: 'highpass',
  rate: 0,
  rolloff: -12,
});

export const defaultOscillator = (): Oscillator => ({ type: 'sine' });

export const defaultNotes = (): Notes => ({
  scale: 'C major',
  subdivision: 8,
  octave: 4,
});

export const defaultEnvelope = () => ({
  attack: 0.1,
  decay: 0.2,
  sustain: 1.0,
  release: 0.8,
});
