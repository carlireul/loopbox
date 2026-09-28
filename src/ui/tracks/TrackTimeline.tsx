import { useProjectStore } from '../../store/projectStore';
import { subdivisionOf, triggerMapFor } from '../../audio/sequence';
import { useDrawIndex } from '../../audio/useEngine';

/**
 * The read-only 16-cell strip shown on each overview row: active columns plus a
 * moving playhead. Ported from the legacy in-row timeline.
 */
export function TrackTimeline({ id }: { id: string }) {
  const track = useProjectStore((s) => s.tracks[id]);
  const draw = useDrawIndex();
  if (!track || !('steps' in track)) return null;

  const subdivision = subdivisionOf(track)!;
  const stride = 16 / subdivision;
  const activeColumns = new Set<number>();
  triggerMapFor(track).forEach((notes, step) => {
    if (notes.length > 0) activeColumns.add(step * stride);
  });

  return (
    <div className="track-timeline-synth">
      <div className="flex w-full gap-[2px]">
        {Array.from({ length: 16 }, (_, i) => {
          let cls = 'timeline-button';
          if (i % 4 === 0) cls += ' sequencer-beat';
          if (activeColumns.has(i)) cls += ' sequencer-active';
          if (i === draw) cls += ' sequencer-playing';
          return (
            <div key={i} className="flex-1">
              <button className={cls} disabled />
            </div>
          );
        })}
      </div>
    </div>
  );
}
