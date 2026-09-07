import { useProjectStore } from '../../store/projectStore';
import type { Subdivision } from '../../model/types';
import { SCALE_OPTIONS } from '../../model/music';
import { TrackControls } from '../tracks/TrackControls';
import { Sequencer } from './Sequencer';
import { SynthEditor } from './SynthEditor';
import { EffectEditor } from './EffectEditor';

const SUBDIVISIONS: Subdivision[] = [4, 8, 16];

/** Full editor for a synth track: controls, sequencer, synth + effect editors. */
export function SynthEditorTab({ id }: { id: string }) {
  const track = useProjectStore((s) => s.tracks[id]);
  const setSubdivision = useProjectStore((s) => s.setSubdivision);
  const setScale = useProjectStore((s) => s.setScale);
  const nudgeOctave = useProjectStore((s) => s.nudgeOctave);
  if (!track || track.type !== 'synth') return null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[60%_40%]">
      <div>
        <TrackControls id={id}>
          <select
            className="control"
            value={track.notes.subdivision}
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
          <select
            className="control"
            value={track.notes.scale}
            aria-label="Scale"
            onChange={(e) => setScale(id, e.target.value)}
          >
            {SCALE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <span className="flex items-center gap-1">
            <button
              className="track-button"
              onClick={() => nudgeOctave(id, -1)}
              aria-label="Octave down"
            >
              −
            </button>
            <i className="fa-solid fa-music" title="Octave" />
            <span className="w-4 text-center">{track.notes.octave}</span>
            <button
              className="track-button"
              onClick={() => nudgeOctave(id, 1)}
              aria-label="Octave up"
            >
              +
            </button>
          </span>
        </TrackControls>
        <div className="pt-3">
          <Sequencer id={id} />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <SynthEditor track={track} />
        <EffectEditor id={id} />
      </div>
    </div>
  );
}
