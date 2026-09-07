import * as Tone from 'tone';
import type {
  AudioTrack,
  SamplerTrack,
  Subdivision,
  SynthTrack,
  Track,
} from '../model/types';
import { defaultFilter } from '../model/defaults';
import { triggerMapFor } from './sequence';
import { VoiceChain } from './VoiceChain';

/**
 * A playable voice for one track. The engine owns a single 16th-note clock and
 * calls `tick` on every voice; each voice decides — from its own subdivision —
 * whether the current step should fire. This replaces the per-component Tone.js
 * graphs and `scheduleRepeat` calls in the legacy track components.
 */
export interface TrackVoice {
  readonly id: string;
  /** Re-apply the track's state to the audio nodes. */
  sync(track: Track): void;
  /** Called on each 16th note with the step index (0–15) and audio time. */
  tick(sixteenth: number, time: number): void;
  /** Latest output level, 0–1 (0 when the voice has no meter). */
  getLevel(): number;
  dispose(): void;
}

/** Steps in a 16th grid per one step of this voice's subdivision. */
function stride(subdivision: Subdivision): number {
  return 16 / subdivision;
}

export class SynthVoice implements TrackVoice {
  readonly id: string;
  private readonly synth = new Tone.PolySynth();
  private readonly chain: VoiceChain;
  private subdivision: Subdivision;
  private triggerMap: string[][] = [];

  constructor(track: SynthTrack) {
    this.id = track.id;
    this.subdivision = track.notes.subdivision;
    this.chain = new VoiceChain(track.controls, track.synth.filter, {
      meter: true,
    });
    this.chain.setSource(this.synth);
    this.sync(track);
  }

  sync(track: Track) {
    if (track.type !== 'synth') return;
    this.synth.set({
      envelope: track.synth.envelope,
      oscillator: { type: track.synth.oscillator.type },
    });
    this.chain.applyControls(track.controls);
    this.chain.applyFilter(track.synth.filter);
    this.chain.applyEffects(track.effects);
    this.subdivision = track.notes.subdivision;
    this.triggerMap = triggerMapFor(track);
  }

  tick(sixteenth: number, time: number) {
    const s = stride(this.subdivision);
    if (sixteenth % s !== 0) return;
    const notes = this.triggerMap[sixteenth / s];
    if (notes && notes.length > 0) {
      this.synth.triggerAttackRelease(notes, `${this.subdivision}n`, time);
    }
  }

  getLevel() {
    return this.chain.getLevel();
  }

  dispose() {
    this.synth.disconnect();
    this.synth.dispose();
    this.chain.dispose();
  }
}

export class SamplerVoice implements TrackVoice {
  readonly id: string;
  private players: Tone.Players;
  private readonly chain: VoiceChain;
  private subdivision: Subdivision;
  private triggerMap: string[][] = [];

  constructor(track: SamplerTrack) {
    this.id = track.id;
    this.subdivision = track.subdivision;
    this.players = new Tone.Players(track.instruments);
    this.chain = new VoiceChain(track.controls, track.filter);
    this.chain.setSource(this.players);
    this.sync(track);
  }

  sync(track: Track) {
    if (track.type !== 'sampler') return;
    this.chain.applyControls(track.controls);
    this.chain.applyFilter(track.filter);
    this.chain.applyEffects(track.effects);
    this.subdivision = track.subdivision;
    this.triggerMap = triggerMapFor(track);
  }

  tick(sixteenth: number, time: number) {
    const s = stride(this.subdivision);
    if (sixteenth % s !== 0) return;
    const keys = this.triggerMap[sixteenth / s];
    if (!keys) return;
    for (const key of keys) {
      if (!this.players.has(key)) continue;
      const player = this.players.player(key);
      if (player.loaded) player.start(time);
    }
  }

  getLevel() {
    return this.chain.getLevel();
  }

  dispose() {
    this.players.disconnect();
    this.players.dispose();
    this.chain.dispose();
  }
}

/**
 * An uploaded audio clip, synced to the transport. Audio tracks carry no
 * sequencer, so `tick` is a no-op. The filter slot is bypassed (wet 0).
 */
export class AudioVoice implements TrackVoice {
  readonly id: string;
  private readonly player: Tone.Player;
  private readonly chain: VoiceChain;
  private readonly objectUrl: string;

  constructor(track: AudioTrack) {
    this.id = track.id;
    this.objectUrl = URL.createObjectURL(track.blob);
    this.player = new Tone.Player(this.objectUrl);
    this.player.sync().start(0);
    this.chain = new VoiceChain(track.controls, defaultFilter());
    this.chain.setSource(this.player);
    this.sync(track);
  }

  sync(track: Track) {
    if (track.type !== 'audio') return;
    this.chain.applyControls(track.controls);
    this.chain.applyEffects(track.effects);
  }

  tick() {
    // Audio clips follow the transport directly; nothing to schedule per step.
  }

  getLevel() {
    return this.chain.getLevel();
  }

  dispose() {
    this.player.unsync();
    this.player.disconnect();
    this.player.dispose();
    this.chain.dispose();
    URL.revokeObjectURL(this.objectUrl);
  }
}

/** Build the right voice for a track. */
export function createVoice(track: Track): TrackVoice {
  switch (track.type) {
    case 'synth':
      return new SynthVoice(track);
    case 'sampler':
      return new SamplerVoice(track);
    case 'audio':
      return new AudioVoice(track);
  }
}
