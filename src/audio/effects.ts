import * as Tone from 'tone';
import type {
  DelayOptions,
  DistortionOptions,
  ReverbOptions,
} from '../model/types';

/** The three effects that can be toggled on/off in the chain (EQ is always on). */
export type ToggleableEffect = 'distortion' | 'delay' | 'reverb';

export type ToggleableOptions =
  DistortionOptions | DelayOptions | ReverbOptions;

/**
 * A live effect node plus the closures to update or dispose it. Wrapping the
 * concrete Tone node in a closure keeps its precise `.set` signature in scope,
 * so the rest of the engine can treat effects uniformly. Ported from the
 * legacy `createEffect` helper.
 */
export interface EffectSlot {
  readonly node: Tone.ToneAudioNode;
  update(options: ToggleableOptions): void;
  dispose(): void;
}

export function createEffectSlot(
  name: ToggleableEffect,
  options: ToggleableOptions,
): EffectSlot {
  switch (name) {
    case 'distortion': {
      const node = new Tone.Distortion();
      node.set(options as DistortionOptions);
      return {
        node,
        update: (o) => node.set(o as DistortionOptions),
        dispose: () => disposeNode(node),
      };
    }
    case 'delay': {
      const node = new Tone.FeedbackDelay();
      node.set(options as DelayOptions);
      return {
        node,
        update: (o) => node.set(o as DelayOptions),
        dispose: () => disposeNode(node),
      };
    }
    case 'reverb': {
      const node = new Tone.Reverb();
      node.set(options as ReverbOptions);
      return {
        node,
        update: (o) => node.set(o as ReverbOptions),
        dispose: () => disposeNode(node),
      };
    }
  }
}

function disposeNode(node: Tone.ToneAudioNode) {
  node.disconnect();
  node.dispose();
}
