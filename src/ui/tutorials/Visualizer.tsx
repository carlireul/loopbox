import { useEffect, useRef } from 'react';
import { audioEngine } from '../../audio/AudioEngine';

/**
 * A simple amplitude bar driven by the track's live output level (synth voices
 * carry a meter). Ported from the legacy `Visualizer`, reading the engine
 * instead of a Tone.Meter ref.
 */
export function Visualizer({
  trackId,
  height = 100,
  width = 100,
}: {
  trackId: string;
  height?: number;
  width?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let raf = 0;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const level = audioEngine.getLevel(trackId) * 300;
      if (level > 0.09) {
        ctx.fillStyle = '#fcb874';
        ctx.fillRect(0, canvas.height - level, canvas.width, level);
      }
      raf = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(raf);
  }, [trackId]);

  return <canvas ref={ref} height={height} width={width} />;
}
