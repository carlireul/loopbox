import { beforeEach, describe, expect, it } from 'vitest';
import { useProjectStore } from './projectStore';
import { db } from '../data/database';
import {
  createProject,
  createSamplerTrack,
  createSynthTrack,
} from '../model/factories';
import type { SynthTrack } from '../model/types';

const store = () => useProjectStore.getState();

let synthId: string;
let samplerId: string;
let projectId: string;

beforeEach(async () => {
  store().close();
  await db.tracks.clear();
  await db.projects.clear();

  const synth = createSynthTrack('Lead');
  const sampler = createSamplerTrack('Drums', {
    kick: 'k.wav',
    snare: 's.wav',
  });
  const project = createProject('Test Song', [synth.id, sampler.id]);
  synthId = synth.id;
  samplerId = sampler.id;
  projectId = project.id;

  await db.tracks.bulkAdd([synth, sampler]);
  await db.projects.add(project);
  await store().load(projectId);
});

describe('load', () => {
  it('hydrates the active project and its tracks', () => {
    expect(store().status).toBe('ready');
    expect(store().project?.name).toBe('Test Song');
    expect(Object.keys(store().tracks)).toHaveLength(2);
  });

  it('throws for a missing project', async () => {
    await expect(store().load('does-not-exist')).rejects.toThrow();
  });
});

describe('track mutations', () => {
  it('renames a track', () => {
    store().renameTrack(synthId, 'Bass');
    expect(store().tracks[synthId].name).toBe('Bass');
  });

  it('toggles a step on and off', () => {
    store().toggleStep(synthId, 0, 0);
    expect((store().tracks[synthId] as SynthTrack).steps[0][0]).toBe(true);
    store().toggleStep(synthId, 0, 0);
    expect((store().tracks[synthId] as SynthTrack).steps[0][0]).toBe(false);
  });

  it('resizes the grid when subdivision changes, preserving overlap', () => {
    store().toggleStep(synthId, 0, 0);
    store().setSubdivision(synthId, 16);
    const t = store().tracks[synthId] as SynthTrack;
    expect(t.notes.subdivision).toBe(16);
    expect(t.steps[0]).toHaveLength(16);
    expect(t.steps[0][0]).toBe(true); // preserved
  });

  it('resizes rows when the scale changes', () => {
    store().setScale(synthId, 'C major pentatonic');
    const t = store().tracks[synthId] as SynthTrack;
    expect(t.notes.scale).toBe('C major pentatonic');
    expect(t.steps).toHaveLength(5);
  });

  it('clamps octave nudges to 1..7', () => {
    for (let i = 0; i < 10; i++) store().nudgeOctave(synthId, 1);
    expect((store().tracks[synthId] as SynthTrack).notes.octave).toBe(7);
    for (let i = 0; i < 10; i++) store().nudgeOctave(synthId, -1);
    expect((store().tracks[synthId] as SynthTrack).notes.octave).toBe(1);
  });

  it('toggles solo and mute', () => {
    store().toggleSolo(synthId);
    store().toggleMute(synthId);
    expect(store().tracks[synthId].controls.solod).toBe(true);
    expect(store().tracks[synthId].controls.muted).toBe(true);
  });

  it('patches controls', () => {
    store().updateControls(synthId, { vol: -3, pan: 0.5 });
    expect(store().tracks[synthId].controls.vol).toBe(-3);
    expect(store().tracks[synthId].controls.pan).toBe(0.5);
  });

  it('updates the filter on both synth and sampler tracks', () => {
    store().updateFilter(synthId, { wet: 1, cutoff: 400 });
    store().updateFilter(samplerId, { wet: 1 });
    const synth = store().tracks[synthId] as SynthTrack;
    expect(synth.synth.filter.wet).toBe(1);
    expect(synth.synth.filter.cutoff).toBe(400);
    expect(store().tracks[samplerId]).toMatchObject({ filter: { wet: 1 } });
  });

  it('toggles effects and patches their options', () => {
    store().toggleEffect(synthId, 'reverb');
    store().updateEffectOptions(synthId, 'reverb', { wet: 0.9 });
    expect(store().tracks[synthId].effects.reverb.enabled).toBe(true);
    expect(store().tracks[synthId].effects.reverb.options.wet).toBe(0.9);
  });
});

describe('structural changes persist immediately', () => {
  it('adds a synth to the store and to Dexie', async () => {
    const id = await store().addSynth();
    expect(store().tracks[id].type).toBe('synth');
    expect(store().project?.trackIds).toContain(id);

    const persisted = await db.tracks.get(id);
    expect(persisted?.type).toBe('synth');
    const project = await db.projects.get(projectId);
    expect(project?.trackIds).toContain(id);
  });

  it('adds a sampler from a pack', async () => {
    const id = await store().addSampler('808');
    const track = store().tracks[id];
    expect(track.type).toBe('sampler');
    if (track.type === 'sampler') {
      expect(Object.keys(track.instruments).length).toBeGreaterThan(0);
    }
  });

  it('removes a track from the store and Dexie', async () => {
    await store().removeTrack(samplerId);
    expect(store().tracks[samplerId]).toBeUndefined();
    expect(store().project?.trackIds).not.toContain(samplerId);
    expect(await db.tracks.get(samplerId)).toBeUndefined();
  });
});

describe('save', () => {
  it('flushes in-memory edits to Dexie', async () => {
    store().renameTrack(synthId, 'Saved Name');
    store().setBpm(140);
    await store().save();

    const track = await db.tracks.get(synthId);
    const project = await db.projects.get(projectId);
    expect(track?.name).toBe('Saved Name');
    expect(project?.bpm).toBe(140);
  });
});
