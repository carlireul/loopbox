import { useProjectStore } from '../../store/projectStore';
import { TrackControls } from '../tracks/TrackControls';
import { AudioWaveform } from '../tracks/AudioWaveform';
import { EffectEditor } from './EffectEditor';

/** Full editor for an uploaded audio track: waveform, controls, effects. */
export function AudioEditorTab({ id }: { id: string }) {
  const track = useProjectStore((s) => s.tracks[id]);
  if (!track || track.type !== 'audio') return null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[60%_40%]">
      <div>
        <TrackControls id={id} />
        <div className="pt-3">
          <AudioWaveform blob={track.blob} height={140} />
        </div>
      </div>
      <div>
        <EffectEditor id={id} />
      </div>
    </div>
  );
}
