import { useEffect, useState } from 'react';
import { audioEngine } from './AudioEngine';
import { useProjectStore } from '../store/projectStore';

/**
 * The bridge between the store (source of truth) and the audio engine. Mount
 * once inside the DAW: it pushes track and transport state into the engine
 * whenever the store changes. Components never call Tone.js directly.
 */
export function useEngineSync() {
  const tracks = useProjectStore((s) => s.tracks);
  const bpm = useProjectStore((s) => s.project?.bpm);
  const vol = useProjectStore((s) => s.project?.vol);

  useEffect(() => {
    audioEngine.setTracks(tracks);
  }, [tracks]);

  useEffect(() => {
    if (bpm != null) audioEngine.setBpm(bpm);
  }, [bpm]);

  useEffect(() => {
    if (vol != null) audioEngine.setMasterVolume(vol);
  }, [vol]);
}

/** Playing state + transport controls, kept in sync with the engine. */
export function useTransport() {
  const [playing, setPlaying] = useState(audioEngine.isPlaying);
  useEffect(() => audioEngine.onPlayingChange(setPlaying), []);
  return {
    playing,
    toggle: () => audioEngine.toggle(),
    stop: () => audioEngine.stop(),
  };
}

/** The current 16th-note step index (0–15), driven by the engine's draw clock. */
export function useDrawIndex(): number {
  const [index, setIndex] = useState(0);
  useEffect(() => audioEngine.onDraw(setIndex), []);
  return index;
}
