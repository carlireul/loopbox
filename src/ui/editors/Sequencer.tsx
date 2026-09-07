import { useProjectStore } from '../../store/projectStore';
import { labelsFor, subdivisionOf } from '../../audio/sequence';
import { useDrawIndex } from '../../audio/useEngine';

const label = (raw: string) => {
  const base = raw.split('_')[0];
  return base.charAt(0).toUpperCase() + base.slice(1);
};

/** The note/step grid. One row per note or instrument, one pad per step. */
export function Sequencer({ id }: { id: string }) {
  const track = useProjectStore((s) => s.tracks[id]);
  const toggleStep = useProjectStore((s) => s.toggleStep);
  const drawIndex = useDrawIndex();

  if (!track || !('steps' in track)) return null;
  const subdivision = subdivisionOf(track)!;
  const labels = labelsFor(track);
  const playingColumn = Math.floor(drawIndex / (16 / subdivision));

  return (
    <div className="flex flex-col gap-1">
      {track.steps.map((row, noteIndex) => (
        <div
          className="flex items-center gap-1"
          key={labels[noteIndex] ?? noteIndex}
        >
          <span className="note-name w-16 shrink-0 text-xs">
            {label(labels[noteIndex] ?? '')}
          </span>
          {row.map((on, stepIndex) => {
            let cls = 'sequencer-button flex-1';
            if (on) cls += ' sequencer-active';
            if (stepIndex % (subdivision / 4) === 0) cls += ' sequencer-beat';
            if (stepIndex === playingColumn) cls += ' sequencer-playing';
            return (
              <button
                key={stepIndex}
                className={cls}
                aria-label={`row ${noteIndex} step ${stepIndex}`}
                aria-pressed={on}
                onClick={() => toggleStep(id, noteIndex, stepIndex)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
