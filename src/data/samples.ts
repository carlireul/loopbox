import type { Sample } from '../model/types';
// The legacy sample library: a module of `type_pack` → asset-URL exports.
import * as sampleFiles from './samples/samples.js';

/**
 * The built-in sample library, derived from the static asset imports. Samples
 * are build-time assets, so — unlike the legacy app — we keep them in a typed
 * in-memory list rather than seeding them into IndexedDB.
 */
export const sampleLibrary: Sample[] = Object.entries(sampleFiles).map(
  ([key, source]) => {
    const [sampleType, pack] = key.split('_');
    return { sampleType, pack, name: key, source };
  },
);

const KIT_PACKS = ['808', 'acoustic', 'analog', 'electro'] as const;
export type KitPack = (typeof KIT_PACKS)[number];

export const kitPacks = KIT_PACKS;

/**
 * Build an instrument map (name → source URL) for a sample pack, de-duplicating
 * repeated sample types with a numeric suffix. Ported from the legacy
 * `useTrackDB.addNewSampler` / `App.newProject` logic.
 */
export function buildKit(pack: string): Record<string, string> {
  const instruments: Record<string, string> = {};
  let counter = 1;
  for (const sample of sampleLibrary.filter((s) => s.pack?.startsWith(pack))) {
    if (sample.sampleType in instruments) {
      instruments[`${sample.sampleType}_${counter}`] = sample.source;
      counter += 1;
    } else {
      instruments[sample.sampleType] = sample.source;
    }
  }
  return instruments;
}

/** Pick a random sample of a given type. */
function randomOfType(sampleType: string): string | undefined {
  const options = sampleLibrary.filter((s) => s.sampleType === sampleType);
  if (options.length === 0) return undefined;
  return options[Math.floor(Math.random() * options.length)].source;
}

/**
 * Build a randomised kit: one sample per core drum voice, plus one random
 * extra. Ported from the legacy `addNewSampler` "random" branch.
 */
export function buildRandomKit(): Record<string, string> {
  const core = ['kick', 'clap', 'hihat', 'openhat', 'snare', 'tom', 'crash'];
  const extras = ['perc', 'ride', 'shaker'];
  const keys = [...core, extras[Math.floor(Math.random() * extras.length)]];

  const instruments: Record<string, string> = {};
  for (const key of keys) {
    const source = randomOfType(key);
    if (source) instruments[key] = source;
  }
  return instruments;
}
