import Dexie, { type Table } from 'dexie';
import type { Project, Track } from '../model/types';
import {
  createProject,
  createSamplerTrack,
  createSynthTrack,
} from '../model/factories';
import { buildKit } from './samples';

/**
 * Typed persistence layer. Dexie is the canonical durable store; the Zustand
 * store holds the active project's working state and flushes back here (see
 * REBUILD_PLAN.md). A fresh database name ("loopbox") gives us the clean-slate
 * schema — the legacy app's "database" IndexedDB is left untouched.
 */
export class LoopboxDatabase extends Dexie {
  projects!: Table<Project, string>;
  tracks!: Table<Track, string>;

  constructor(name = 'loopbox') {
    super(name);
    this.version(1).stores({
      projects: 'id, name',
      tracks: 'id, type',
    });

    this.on('populate', () => this.seed());
  }

  /**
   * Seed a first-run project: one synth and one 808 drum kit, matching the
   * "New Project" experience. Runs inside Dexie's populate transaction.
   */
  private seed() {
    const synth = createSynthTrack('Synth');
    const drums = createSamplerTrack('Drums', buildKit('808'));
    const project = createProject('New Project', [synth.id, drums.id]);

    this.tracks.bulkAdd([synth, drums]);
    this.projects.add(project);
  }
}

export const db = new LoopboxDatabase();
