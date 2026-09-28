import { afterEach, describe, expect, it } from 'vitest';
import { LoopboxDatabase } from './database';

/** Each test gets its own freshly-seeded database. */
async function freshDb() {
  const name = `loopbox-test-${crypto.randomUUID()}`;
  const db = new LoopboxDatabase(name);
  await db.open(); // triggers the populate/seed handler
  return db;
}

const opened: LoopboxDatabase[] = [];
afterEach(async () => {
  while (opened.length) {
    const db = opened.pop()!;
    db.close();
    await db.delete();
  }
}, 20_000);

describe('LoopboxDatabase seeding', () => {
  it('seeds exactly one project on first run', async () => {
    const db = await freshDb();
    opened.push(db);
    const projects = await db.projects.toArray();
    expect(projects).toHaveLength(1);
    expect(projects[0].name).toBe('New Project');
  });

  it('seeds a synth and a drum sampler wired to the project', async () => {
    const db = await freshDb();
    opened.push(db);
    const project = (await db.projects.toArray())[0];
    const tracks = await db.tracks.bulkGet(project.trackIds);

    expect(tracks).toHaveLength(2);
    const types = tracks.map((t) => t?.type).sort();
    expect(types).toEqual(['sampler', 'synth']);
  });
});
