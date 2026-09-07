import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  Controls,
  EffectName,
  Effects,
  Filter,
  Project,
  SamplerTrack,
  Subdivision,
  SynthTrack,
  Track,
} from '../model/types';
import {
  createAudioTrack,
  createSamplerTrack,
  createSynthTrack,
} from '../model/factories';
import { resizeSteps } from '../model/steps';
import { scaleRowCount } from '../model/scale';
import { db } from '../data/database';
import { buildKit, buildRandomKit } from '../data/samples';

/**
 * The active-project working store. This is the single in-memory source of
 * truth while editing; it is hydrated from Dexie on load and flushed back on
 * save (and on structural changes so the project list stays correct). It
 * replaces the legacy `TrackContext` god-object, the `useTrack` type-switch
 * hook, and `useTrackDB`.
 */

interface ProjectState {
  project: Project | null;
  tracks: Record<string, Track>;
  status: 'idle' | 'loading' | 'ready';

  // lifecycle
  load: (projectId: string) => Promise<void>;
  close: () => void;
  save: () => Promise<void>;

  // project meta
  setProjectName: (name: string) => void;
  setBpm: (bpm: number) => void;
  setMasterVol: (vol: number) => void;

  // tracks: structural
  addSynth: () => Promise<string>;
  addSampler: (pack: string) => Promise<string>;
  addAudio: (file: File) => Promise<string>;
  removeTrack: (id: string) => Promise<void>;

  // tracks: mutations
  renameTrack: (id: string, name: string) => void;
  updateControls: (id: string, patch: Partial<Controls>) => void;
  toggleSolo: (id: string) => void;
  toggleMute: (id: string) => void;
  toggleStep: (id: string, row: number, col: number) => void;
  setSubdivision: (id: string, subdivision: Subdivision) => void;

  // synth-specific
  setScale: (id: string, scale: string) => void;
  nudgeOctave: (id: string, delta: 1 | -1) => void;
  updateEnvelope: (
    id: string,
    patch: Partial<SynthTrack['synth']['envelope']>,
  ) => void;
  setOscillatorType: (
    id: string,
    type: SynthTrack['synth']['oscillator']['type'],
  ) => void;

  // filter (synth + sampler)
  updateFilter: (id: string, patch: Partial<Filter>) => void;

  // effects
  toggleEffect: (id: string, name: EffectName) => void;
  updateEffectOptions: <N extends EffectName>(
    id: string,
    name: N,
    patch: Partial<Effects[N]['options']>,
  ) => void;
}

const OCTAVE_MIN = 1;
const OCTAVE_MAX = 7;

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** The filter lives at a different path on synth vs sampler tracks. */
function filterOf(track: Track): Filter | undefined {
  if (track.type === 'synth') return track.synth.filter;
  if (track.type === 'sampler') return track.filter;
  return undefined;
}

export const useProjectStore = create<ProjectState>()(
  immer((set, get) => ({
    project: null,
    tracks: {},
    status: 'idle',

    // --- lifecycle ---------------------------------------------------------

    load: async (projectId) => {
      set((s) => {
        s.status = 'loading';
      });
      const project = await db.projects.get(projectId);
      if (!project) {
        set((s) => {
          s.status = 'idle';
        });
        throw new Error(`Project ${projectId} not found`);
      }
      const rows = await db.tracks.bulkGet(project.trackIds);
      const tracks: Record<string, Track> = {};
      for (const track of rows) {
        if (track) tracks[track.id] = track;
      }
      set((s) => {
        s.project = project;
        s.tracks = tracks;
        s.status = 'ready';
      });
    },

    close: () => {
      set((s) => {
        s.project = null;
        s.tracks = {};
        s.status = 'idle';
      });
    },

    save: async () => {
      const { project, tracks } = get();
      if (!project) return;
      await db.transaction('rw', db.projects, db.tracks, async () => {
        await db.projects.put(project);
        await db.tracks.bulkPut(Object.values(tracks));
      });
    },

    // --- project meta ------------------------------------------------------

    setProjectName: (name) =>
      set((s) => {
        if (s.project) s.project.name = name;
      }),

    setBpm: (bpm) =>
      set((s) => {
        if (s.project) s.project.bpm = bpm;
      }),

    setMasterVol: (vol) =>
      set((s) => {
        if (s.project) s.project.vol = vol;
      }),

    // --- tracks: structural ------------------------------------------------

    addSynth: async () => {
      const track = createSynthTrack();
      await addTrack(set, get, track);
      return track.id;
    },

    addSampler: async (pack) => {
      const instruments = pack === 'random' ? buildRandomKit() : buildKit(pack);
      const name = pack === 'random' ? 'Random' : capitalize(pack);
      const track = createSamplerTrack(name, instruments);
      await addTrack(set, get, track);
      return track.id;
    },

    addAudio: async (file) => {
      const track = createAudioTrack(file.name.split('.')[0], file);
      await addTrack(set, get, track);
      return track.id;
    },

    removeTrack: async (id) => {
      const project = get().project;
      if (!project) return;
      set((s) => {
        delete s.tracks[id];
        if (s.project) {
          s.project.trackIds = s.project.trackIds.filter((t) => t !== id);
        }
      });
      const trackIds = get().project?.trackIds ?? [];
      await db.transaction('rw', db.projects, db.tracks, async () => {
        await db.tracks.delete(id);
        await db.projects.update(project.id, { trackIds });
      });
    },

    // --- tracks: mutations -------------------------------------------------

    renameTrack: (id, name) =>
      mutate(set, id, (t) => {
        t.name = name;
      }),

    updateControls: (id, patch) =>
      mutate(set, id, (t) => {
        Object.assign(t.controls, patch);
      }),

    toggleSolo: (id) =>
      mutate(set, id, (t) => {
        t.controls.solod = !t.controls.solod;
      }),

    toggleMute: (id) =>
      mutate(set, id, (t) => {
        t.controls.muted = !t.controls.muted;
      }),

    toggleStep: (id, row, col) =>
      mutate(set, id, (t) => {
        if ('steps' in t && t.steps[row]?.[col] !== undefined) {
          t.steps[row][col] = !t.steps[row][col];
        }
      }),

    setSubdivision: (id, subdivision) =>
      mutate(set, id, (t) => {
        if (t.type === 'synth') {
          t.notes.subdivision = subdivision;
          t.steps = resizeSteps(t.steps, t.steps.length, subdivision);
        } else if (t.type === 'sampler') {
          t.subdivision = subdivision;
          t.steps = resizeSteps(t.steps, t.steps.length, subdivision);
        }
      }),

    // --- synth-specific ----------------------------------------------------

    setScale: (id, scale) =>
      mutate(set, id, (t) => {
        if (t.type !== 'synth') return;
        t.notes.scale = scale;
        t.steps = resizeSteps(
          t.steps,
          scaleRowCount(scale),
          t.notes.subdivision,
        );
      }),

    nudgeOctave: (id, delta) =>
      mutate(set, id, (t) => {
        if (t.type !== 'synth') return;
        const next = t.notes.octave + delta;
        if (next >= OCTAVE_MIN && next <= OCTAVE_MAX) t.notes.octave = next;
      }),

    updateEnvelope: (id, patch) =>
      mutate(set, id, (t) => {
        if (t.type === 'synth') Object.assign(t.synth.envelope, patch);
      }),

    setOscillatorType: (id, type) =>
      mutate(set, id, (t) => {
        if (t.type === 'synth') t.synth.oscillator.type = type;
      }),

    // --- filter ------------------------------------------------------------

    updateFilter: (id, patch) =>
      mutate(set, id, (t) => {
        const filter = filterOf(t);
        if (filter) Object.assign(filter, patch);
      }),

    // --- effects -----------------------------------------------------------

    toggleEffect: (id, name) =>
      mutate(set, id, (t) => {
        t.effects[name].enabled = !t.effects[name].enabled;
      }),

    updateEffectOptions: (id, name, patch) =>
      mutate(set, id, (t) => {
        Object.assign(t.effects[name].options, patch);
      }),
  })),
);

// --- internals -------------------------------------------------------------

type SetFn = (recipe: (state: ProjectState) => void) => void;
type GetFn = () => ProjectState;

/** Apply an immer recipe to a single track, if it exists. */
function mutate(set: SetFn, id: string, recipe: (track: Track) => void) {
  set((s) => {
    const track = s.tracks[id];
    if (track) recipe(track);
  });
}

/** Add a track to the store and persist it + the project's ordering. */
async function addTrack(set: SetFn, get: GetFn, track: Track) {
  const project = get().project;
  if (!project) throw new Error('No active project');
  set((s) => {
    s.tracks[track.id] = track;
    s.project?.trackIds.push(track.id);
  });
  const trackIds = get().project?.trackIds ?? [];
  await db.transaction('rw', db.projects, db.tracks, async () => {
    await db.tracks.add(track);
    await db.projects.update(project.id, { trackIds });
  });
}

// Re-exported for selector convenience in components (Phase 3).
export type { SamplerTrack, SynthTrack };
