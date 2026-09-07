import { useProjectStore } from '../../store/projectStore';
import type { Subdivision } from '../../model/types';
import { TrackControls } from '../tracks/TrackControls';
import { Sequencer } from './Sequencer';
import { EffectEditor } from './EffectEditor';
import { DrumTutorial } from '../tutorials/DrumTutorial';

const SUBDIVISIONS: Subdivision[] = [4, 8, 16];

/** Full editor for a sampler track: controls, sequencer, effects. */
export function SamplerEditorTab({ id }: { id: string }) {
  const track = useProjectStore((s) => s.tracks[id]);
  const setSubdivision = useProjectStore((s) => s.setSubdivision);
  if (!track || track.type !== 'sampler') return null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[60%_40%]">
      <div>
        <TrackControls id={id}>
          <select
            className="control"
            value={track.subdivision}
            aria-label="Steps"
            onChange={(e) =>
              setSubdivision(id, Number(e.target.value) as Subdivision)
            }
          >
            {SUBDIVISIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </TrackControls>
        <div className="flex items-center gap-2 pt-3">
          <span className="font-medium">Sequencer</span>
          <DrumTutorial />
        </div>
        <div className="pt-3">
          <Sequencer id={id} />
        </div>
      </div>
      <div>
        <EffectEditor id={id} />
      </div>
    </div>
  );
}
