import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './database';
import { buildKit } from './samples';
import {
  createProject,
  createSamplerTrack,
  createSynthTrack,
} from '../model/factories';

/**
 * Project-level persistence helpers, separate from the active-project store.
 * The project list is read reactively from Dexie via `useLiveQuery`, keeping
 * Dexie the source of truth (unlike the legacy hand-synced context).
 */

/** Reactive list of all saved projects, newest activity last. */
export function useProjectList() {
  return useLiveQuery(() => db.projects.toArray());
}

/** Create a project seeded with a synth and an 808 kit; returns its id. */
export async function createNewProject(name: string): Promise<string> {
  const synth = createSynthTrack('Synth');
  const drums = createSamplerTrack('Drums', buildKit('808'));
  const project = createProject(name, [synth.id, drums.id]);

  await db.transaction('rw', db.projects, db.tracks, async () => {
    await db.tracks.bulkAdd([synth, drums]);
    await db.projects.add(project);
  });
  return project.id;
}

/** Delete a project and its tracks (the legacy app leaked orphaned tracks). */
export async function deleteProject(id: string): Promise<void> {
  await db.transaction('rw', db.projects, db.tracks, async () => {
    const project = await db.projects.get(id);
    if (project) await db.tracks.bulkDelete(project.trackIds);
    await db.projects.delete(id);
  });
}
