import * as Tone from 'tone';
import type { Controls, Effects, Filter } from '../model/types';
import {
  createEffectSlot,
  type EffectSlot,
  type ToggleableEffect,
} from './effects';

const TOGGLEABLE: ToggleableEffect[] = ['distortion', 'delay', 'reverb'];

/**
 * The processing chain shared by synth and sampler voices:
 *
 *   source → [distortion?] → [delay?] → [reverb?] → autoFilter → channel → eq → [meter?] → destination
 *
 * Centralises the filter/channel/eq/effect wiring and the create/dispose/rechain
 * dance that the legacy `SynthTrack` and `SamplerTrack` components each
 * re-implemented across a pile of `useEffect`s.
 */
export class VoiceChain {
  private readonly channel: Tone.Channel;
  private readonly filter: Tone.AutoFilter;
  private readonly eq: Tone.EQ3;
  private readonly meter?: Tone.Meter;
  private readonly slots: Partial<Record<ToggleableEffect, EffectSlot>> = {};
  private source?: Tone.ToneAudioNode;

  constructor(
    controls: Controls,
    filter: Filter,
    options?: { meter?: boolean },
  ) {
    this.channel = new Tone.Channel(controls.vol, controls.pan);
    this.eq = new Tone.EQ3();
    this.filter = new Tone.AutoFilter({
      wet: filter.wet,
      baseFrequency: filter.cutoff,
      frequency: filter.rate,
    }).start();
    if (options?.meter) {
      this.meter = new Tone.Meter();
      this.meter.set({ normalRange: true, smoothing: 0.8 });
    }
    this.applyControls(controls);
    this.applyFilter(filter);
  }

  /** Attach the sound source (PolySynth, Players, ...) and wire the chain. */
  setSource(source: Tone.ToneAudioNode) {
    this.source = source;
    this.rechain();
  }

  applyControls(controls: Controls) {
    this.channel.solo = controls.solod;
    this.channel.mute = controls.muted;
    this.channel.volume.value = controls.vol;
    this.channel.pan.value = controls.pan;
  }

  applyFilter(filter: Filter) {
    this.filter.set({
      wet: filter.wet,
      baseFrequency: filter.cutoff,
      frequency: filter.rate,
    });
    this.filter.filter.set({ type: filter.type, rolloff: filter.rolloff });
  }

  /**
   * Reconcile the toggleable effects and the always-on EQ with new state,
   * creating/disposing effect nodes and re-chaining only when membership
   * changes.
   */
  applyEffects(effects: Effects) {
    this.eq.set(effects.eq.options);

    let membershipChanged = false;
    for (const name of TOGGLEABLE) {
      const enabled = effects[name].enabled;
      const slot = this.slots[name];
      if (enabled && !slot) {
        this.slots[name] = createEffectSlot(name, effects[name].options);
        membershipChanged = true;
      } else if (!enabled && slot) {
        slot.dispose();
        delete this.slots[name];
        membershipChanged = true;
      } else if (slot) {
        slot.update(effects[name].options);
      }
    }
    if (membershipChanged) this.rechain();
  }

  /** Latest meter reading (mono), or 0 if this chain has no meter. */
  getLevel(): number {
    const value = this.meter?.getValue();
    return typeof value === 'number' ? value : 0;
  }

  private rechain() {
    if (!this.source) return;
    this.source.disconnect();
    const enabledEffects = TOGGLEABLE.map((n) => this.slots[n]?.node).filter(
      (n): n is Tone.ToneAudioNode => n != null,
    );
    const tail = this.meter
      ? [this.channel, this.eq, this.meter, Tone.getDestination()]
      : [this.channel, this.eq, Tone.getDestination()];
    this.source.chain(...enabledEffects, this.filter, ...tail);
  }

  dispose() {
    this.source?.disconnect();
    for (const name of TOGGLEABLE) this.slots[name]?.dispose();
    this.filter.disconnect();
    this.filter.dispose();
    this.channel.disconnect();
    this.channel.dispose();
    this.eq.disconnect();
    this.eq.dispose();
    this.meter?.disconnect();
    this.meter?.dispose();
  }
}
