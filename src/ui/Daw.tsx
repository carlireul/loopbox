import { useEffect, useMemo, useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import { audioEngine } from '../audio/AudioEngine';
import { useEngineSync } from '../audio/useEngine';
import { deleteProject } from '../data/projects';
import { Tabs, type TabDef } from './common/Tabs';
import { Renamable } from './common/Renamable';
import { GlobalControls } from './GlobalControls';
import { TrackRow } from './tracks/TrackRow';
import { SynthEditorTab } from './editors/SynthEditorTab';
import { SamplerEditorTab } from './editors/SamplerEditorTab';

const DRUM_PACKS = ['808', 'acoustic', 'analog', 'electro', 'random'];

export function Daw({
  projectId,
  onExit,
}: {
  projectId: string;
  onExit: () => void;
}) {
  useEngineSync();
  const status = useProjectStore((s) => s.status);
  const project = useProjectStore((s) => s.project);
  const tracks = useProjectStore((s) => s.tracks);
  const load = useProjectStore((s) => s.load);
  const close = useProjectStore((s) => s.close);
  const save = useProjectStore((s) => s.save);
  const setProjectName = useProjectStore((s) => s.setProjectName);
  const addSynth = useProjectStore((s) => s.addSynth);
  const addSampler = useProjectStore((s) => s.addSampler);

  const [started, setStarted] = useState(false);
  const [openTabs, setOpenTabs] = useState<string[]>([]);

  useEffect(() => {
    load(projectId).catch(console.error);
    return () => close();
  }, [projectId, load, close]);

  const orderedIds = useMemo(
    () => (project?.trackIds ?? []).filter((id) => tracks[id]),
    [project?.trackIds, tracks],
  );

  const openEditor = (id: string) =>
    setOpenTabs((prev) => (prev.includes(id) ? prev : [...prev, id]));
  const closeEditor = (id: string) =>
    setOpenTabs((prev) => prev.filter((t) => t !== id));

  if (status !== 'ready' || !project) {
    return <div className="p-6 text-gray-500">Loading…</div>;
  }

  if (!started) {
    return (
      <div className="p-6">
        <button
          className="btn-brand text-lg"
          onClick={async () => {
            await audioEngine.start(project.trackEnd);
            setStarted(true);
          }}
        >
          <i className="fa-solid fa-music" /> Start
        </button>
      </div>
    );
  }

  const overview: TabDef = {
    id: 'overview',
    title: 'Overview',
    content: (
      <div className="relative">
        {orderedIds.map((id) => (
          <TrackRow key={id} id={id} onOpen={() => openEditor(id)} />
        ))}
      </div>
    ),
  };

  const editorTabs: TabDef[] = openTabs
    .filter((id) => tracks[id])
    .map((id) => {
      const track = tracks[id];
      return {
        id,
        title: track.name || 'Untitled',
        closeable: true,
        content:
          track.type === 'sampler' ? (
            <SamplerEditorTab id={id} />
          ) : (
            <SynthEditorTab id={id} />
          ),
      };
    });

  return (
    <div className="flex h-screen w-full flex-col p-4">
      <div className="flex-1 overflow-auto">
        <Tabs tabs={[overview, ...editorTabs]} onClose={closeEditor} />
      </div>

      <div className="mt-auto grid grid-cols-1 gap-4 border-t border-gray-200 pt-3 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-2">
          <GlobalControls />
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn-muted" onClick={() => addSynth()}>
              Add Synth
            </button>
            {DRUM_PACKS.map((pack) => (
              <button
                key={pack}
                className="btn-muted"
                onClick={() => addSampler(pack)}
              >
                {pack === 'random'
                  ? 'Random Kit'
                  : `${pack[0].toUpperCase()}${pack.slice(1)}`}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Renamable name={project.name} onChange={setProjectName} />
          <div className="flex gap-2">
            <button className="btn-brand" onClick={() => save()}>
              Save
            </button>
            <button className="btn-muted" onClick={onExit}>
              Open…
            </button>
            <button
              className="btn-muted"
              onClick={async () => {
                await deleteProject(project.id);
                onExit();
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
