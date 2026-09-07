import { useEffect, useRef, useState } from 'react';
import { ClipPlayer } from '../../audio/demos';

/**
 * Owns a ClipPlayer for a tutorial: builds it when the modal opens, disposes it
 * on close, and tracks which clip (if any) is playing. Only one plays at a time.
 */
export function useClipPlayer(urls: Record<string, string>, open: boolean) {
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const playerRef = useRef<ClipPlayer | null>(null);

  useEffect(() => {
    if (!open) return;
    const player = new ClipPlayer(urls);
    playerRef.current = player;
    let alive = true;
    void player.ready.then(() => alive && setReady(true));
    return () => {
      alive = false;
      player.dispose();
      playerRef.current = null;
      setReady(false);
      setPlaying(null);
    };
  }, [open, urls]);

  const toggle = (name: string) => {
    const player = playerRef.current;
    if (!player || !ready) return;
    if (playing === name) {
      player.stop(name);
    } else {
      player.start(name, () =>
        setPlaying((cur) => (cur === name ? null : cur)),
      );
      setPlaying(name);
    }
  };

  return { ready, playing, toggle };
}
