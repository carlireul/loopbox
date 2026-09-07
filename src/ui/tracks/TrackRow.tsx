import { useProjectStore } from '../../store/projectStore';
import { Renamable } from '../common/Renamable';
import { TrackControls } from './TrackControls';
import { TrackTimeline } from './TrackTimeline';

/** One track on the overview: timeline, name, open-editor, delete, controls. */
export function TrackRow({ id, onOpen }: { id: string; onOpen: () => void }) {
  const track = useProjectStore((s) => s.tracks[id]);
  const renameTrack = useProjectStore((s) => s.renameTrack);
  const removeTrack = useProjectStore((s) => s.removeTrack);
  if (!track) return null;

  const icon = track.type === 'sampler' ? 'fa-drum' : 'fa-wave-square';

  return (
    <div className="grid grid-cols-[1.55fr_0.45fr] items-center gap-3 border-b border-gray-200 py-2">
      <TrackTimeline id={id} />
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <button className="track-button" onClick={onOpen} title="Open editor">
            <i className={`fa-solid ${icon}`} />
          </button>
          <Renamable
            name={track.name || 'Untitled'}
            onChange={(v) => renameTrack(id, v)}
          />
          <button
            className="track-button"
            onClick={() => removeTrack(id)}
            title="Delete track"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <TrackControls id={id} />
      </div>
    </div>
  );
}
