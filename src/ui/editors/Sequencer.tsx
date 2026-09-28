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
  const stepCount = track.steps[0]?.length ?? 0;

  return (
    <div>
      {/* Pads keep a minimum tap size; the grid scrolls sideways within this box
       * when they can't all fit (e.g. 16 steps on a phone) rather than shrinking
       * to un-tappable slivers or overflowing the page. */}
      <div className="overflow-x-auto">
        <div
          className="grid min-w-full gap-1"
          style={{
            gridTemplateColumns: `auto repeat(${stepCount}, minmax(2.125rem, 1fr))`,
          }}
        >
          {track.steps.map((row, noteIndex) => (
            <div className="contents" key={labels[noteIndex] ?? noteIndex}>
              <span className="note-name sticky left-0 z-10 flex items-center bg-[#f8f9fa] pr-2 text-xs">
                {label(labels[noteIndex] ?? '')}
              </span>
              {row.map((on, stepIndex) => {
                let cls = 'sequencer-button';
                if (on) cls += ' sequencer-active';
                if (stepIndex % (subdivision / 4) === 0)
                  cls += ' sequencer-beat';
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
      </div>
      {stepCount > 8 && (
        <p className="mt-2 hidden text-xs text-gray-500 portrait:max-sm:block">
          <i className="fa-solid fa-rotate-right" /> Rotate your phone for the
          full grid.
        </p>
      )}
    </div>
  );
}
