import { useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import { audioEngine } from '../audio/AudioEngine';
import { useTransport } from '../audio/useEngine';
import { Renamable } from './common/Renamable';

const BAR_OPTIONS = [1, 2, 4, 8, 16];

/** Transport: play/stop, master volume, BPM, and record-to-MP3. */
export function GlobalControls() {
  const { playing, toggle, stop } = useTransport();
  const project = useProjectStore((s) => s.project);
  const setBpm = useProjectStore((s) => s.setBpm);
  const setMasterVol = useProjectStore((s) => s.setMasterVol);

  const [recording, setRecording] = useState(false);
  const [bars, setBars] = useState(4);
  if (!project) return null;

  const record = async () => {
    setRecording(true);
    try {
      const mp3 = await audioEngine.record(bars);
      const url = URL.createObjectURL(mp3);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${project.name}.mp3`;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setRecording(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-1">
        <button
          className="track-button"
          onClick={toggle}
          aria-label="Play/pause"
        >
          <i className={`fa-solid ${playing ? 'fa-pause' : 'fa-play'}`} />
        </button>
        <button className="track-button" onClick={stop} aria-label="Stop">
          <i className="fa-solid fa-stop" />
        </button>
      </div>

      <label className="flex items-center gap-2">
        <i className="fa-solid fa-volume-high" />
        <input
          type="range"
          min={-20}
          max={20}
          value={project.vol}
          aria-label="Master volume"
          onChange={(e) => setMasterVol(parseInt(e.target.value, 10))}
        />
      </label>

      <div className="flex items-center gap-2">
        <Renamable
          number
          min={40}
          max={200}
          name={project.bpm}
          onChange={(v) => setBpm(parseInt(v, 10))}
        />
        <span className="text-sm">BPM</span>
        <input
          type="range"
          min={40}
          max={200}
          value={project.bpm}
          aria-label="BPM"
          onChange={(e) => setBpm(parseInt(e.target.value, 10))}
        />
      </div>

      <div className="flex items-center gap-2">
        <button className="btn-muted" onClick={record} disabled={recording}>
          {recording ? 'Recording…' : 'Record'}
        </button>
        <select
          className="control"
          value={bars}
          aria-label="Record length (bars)"
          onChange={(e) => setBars(Number(e.target.value))}
        >
          {BAR_OPTIONS.map((b) => (
            <option key={b} value={b}>
              {b} {b > 1 ? 'Bars' : 'Bar'}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
