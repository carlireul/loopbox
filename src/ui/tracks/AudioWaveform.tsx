import { useEffect, useRef } from 'react';
import Peaks, { type PeaksInstance } from 'peaks.js';

const WAVEFORM_COLOR = '#74C0FC';

/**
 * A read-only waveform for an uploaded audio clip, rendered from the track's
 * blob with peaks.js. Playback is owned by the AudioEngine, so this view is
 * display-only: the backing media element is muted and never driven here.
 *
 * Ported from the legacy `AudioTrack` peaks integration, minus the transport
 * wiring (the engine now owns the transport and player).
 */
export function AudioWaveform({
  blob,
  height = 90,
}: {
  blob: Blob;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const media = mediaRef.current;
    if (!container || !media) return;

    const objectUrl = URL.createObjectURL(blob);
    media.src = objectUrl;

    let instance: PeaksInstance | null = null;
    let cancelled = false;
    const audioContext = new AudioContext();

    Peaks.init(
      {
        zoomview: {
          container,
          waveformColor: WAVEFORM_COLOR,
          playheadColor: 'transparent',
        },
        mediaElement: media,
        webAudio: { audioContext, scale: 128, multiChannel: false },
        zoomLevels: [128],
      },
      (err, peaks) => {
        if (err || cancelled || !peaks) {
          peaks?.destroy();
          return;
        }
        instance = peaks;
      },
    );

    return () => {
      cancelled = true;
      instance?.destroy();
      void audioContext.close();
      URL.revokeObjectURL(objectUrl);
    };
  }, [blob]);

  return (
    <div className="track-timeline-audio">
      <div ref={containerRef} className="h-full w-full" style={{ height }} />
      <audio ref={mediaRef} muted preload="metadata" hidden />
    </div>
  );
}
