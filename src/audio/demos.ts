import * as Tone from 'tone';
import type { OscillatorType } from '../model/types';

/**
 * Self-contained Tone.js players for the tutorials. They deliberately live
 * outside the AudioEngine: they don't touch the transport or the project mix,
 * they just make a sound while a tutorial modal is open. Keeping the Tone.js
 * here (rather than in the tutorial components) preserves the "no Tone in
 * components" rule from Phase 2.
 */

const SINE_ENVELOPE = { attack: 0, decay: 1, sustain: 1, release: 0.1 };

/**
 * The wavelength (inverse frequency) for the filter tutorial's animated LFO
 * wave. `0` (LFO off) has no frequency, so fall back to a slow flat-ish wave.
 */
export function lfoWavelength(rate: number | string): number {
  const hz = Tone.Frequency(rate).toFrequency();
  return hz > 0 ? 1 / hz : 999;
}

/** A single synth voice for the wave tutorial, soloed so it plays alone. */
export class SineDemo {
  private readonly solo = new Tone.Solo().toDestination();
  private readonly synth = new Tone.Synth().connect(this.solo);

  constructor() {
    this.synth.set({ envelope: SINE_ENVELOPE, oscillator: { type: 'sine' } });
    this.synth.volume.value = -2;
  }

  play(type: OscillatorType) {
    this.solo.solo = true;
    this.synth.set({ oscillator: { type } });
    this.synth.triggerAttack('C4');
  }

  release() {
    this.synth.triggerRelease();
    this.solo.solo = false;
  }

  setFrequency(hz: number) {
    this.synth.frequency.value = hz;
  }

  setAmplitude(db: number) {
    this.synth.set({ oscillator: { volume: db } });
  }

  dispose() {
    this.release();
    this.synth.disconnect();
    this.synth.dispose();
    this.solo.disconnect();
    this.solo.dispose();
  }
}

/**
 * Plays one of a set of preloaded clips at a time (drum-pattern and effect
 * tutorials). `ready` resolves once the buffers have loaded.
 */
export class ClipPlayer {
  private readonly solo = new Tone.Solo().toDestination();
  private players!: Tone.Players;
  readonly ready: Promise<void>;

  constructor(urls: Record<string, string>) {
    this.ready = new Promise((resolve) => {
      this.players = new Tone.Players(urls, () => {
        this.players.connect(this.solo);
        resolve();
      });
    });
  }

  /** Start `name`, stopping anything already playing. `onStop` fires when it ends. */
  start(name: string, onStop?: () => void) {
    this.solo.solo = true;
    this.players.stopAll();
    const player = this.players.player(name);
    player.onstop = () => onStop?.();
    player.start();
  }

  stop(name: string) {
    this.players.player(name).stop();
  }

  dispose() {
    this.solo.solo = false;
    this.players.stopAll();
    this.players.disconnect();
    this.players.dispose();
    this.solo.disconnect();
    this.solo.dispose();
  }
}
