import * as Tone from 'tone';
import type { Track } from '../model/types';
import { sixteenths } from './beat';
import { createVoice, type TrackVoice } from './voices';
import { webmToMp3 } from './export';

export type Unsubscribe = () => void;

/**
 * The audio engine: a framework-agnostic owner of the Tone.js transport and one
 * voice per track. React never touches Tone directly — components mutate the
 * store, a thin bridge reflects that state into `setTracks` / `setTransport`,
 * and the engine drives all voices from a single shared 16th-note clock.
 *
 * This replaces the transport handling in `GlobalControls` and the per-track
 * Tone graphs and schedules in `SynthTrack` / `SamplerTrack` / `AudioTrack`.
 */
export class AudioEngine {
  private readonly voices = new Map<string, TrackVoice>();
  private clockId: number | null = null;
  private started = false;
  private loopEnd = '1:0:0';

  private readonly drawListeners = new Set<(sixteenth: number) => void>();
  private readonly playingListeners = new Set<(playing: boolean) => void>();

  /** Resume the AudioContext (must be called from a user gesture) and arm the transport. */
  async start(loopEnd = this.loopEnd): Promise<void> {
    await Tone.start();
    this.loopEnd = loopEnd;
    const transport = Tone.getTransport();
    transport.loop = true;
    transport.loopStart = 0;
    transport.loopEnd = loopEnd;
    transport.position = '0:0:0';
    this.ensureClock();
    this.started = true;
  }

  get isStarted() {
    return this.started;
  }

  // --- transport params ------------------------------------------------------

  setBpm(bpm: number) {
    Tone.getTransport().bpm.value = bpm;
  }

  setMasterVolume(db: number) {
    Tone.getDestination().volume.value = db;
  }

  setLoopEnd(loopEnd: string) {
    this.loopEnd = loopEnd;
    Tone.getTransport().loopEnd = loopEnd;
  }

  // --- voices ----------------------------------------------------------------

  /** Reconcile live voices with the given tracks: add, update, and dispose. */
  setTracks(tracks: Record<string, Track>) {
    for (const [id, track] of Object.entries(tracks)) {
      const voice = this.voices.get(id);
      if (voice) {
        voice.sync(track);
      } else {
        this.voices.set(id, createVoice(track));
      }
    }
    for (const id of this.voices.keys()) {
      if (!(id in tracks)) {
        this.voices.get(id)!.dispose();
        this.voices.delete(id);
      }
    }
  }

  getLevel(trackId: string): number {
    return this.voices.get(trackId)?.getLevel() ?? 0;
  }

  // --- playback --------------------------------------------------------------

  get isPlaying() {
    return Tone.getTransport().state === 'started';
  }

  play() {
    Tone.getTransport().start();
    this.emitPlaying();
  }

  pause() {
    Tone.getTransport().pause();
    this.emitPlaying();
  }

  toggle() {
    if (this.isPlaying) {
      Tone.getTransport().pause();
    } else {
      Tone.getTransport().start();
    }
    this.emitPlaying();
  }

  stop() {
    const transport = Tone.getTransport();
    transport.stop();
    transport.position = '0:0:0';
    this.emitPlaying();
  }

  // --- subscriptions ---------------------------------------------------------

  /** Fires on every 16th note with the current step index (0–15). */
  onDraw(listener: (sixteenth: number) => void): Unsubscribe {
    this.drawListeners.add(listener);
    return () => this.drawListeners.delete(listener);
  }

  onPlayingChange(listener: (playing: boolean) => void): Unsubscribe {
    this.playingListeners.add(listener);
    return () => this.playingListeners.delete(listener);
  }

  // --- recording -------------------------------------------------------------

  /**
   * Record `bars` loops of the current mix and return an MP3 blob. Ported from
   * the legacy `GlobalControls.record`; the caller decides what to do with the
   * file (the engine no longer reaches into the DOM to trigger a download).
   */
  async record(bars: number): Promise<Blob> {
    const wasPlaying = this.isPlaying;
    if (wasPlaying) this.stop();

    const recorder = new Tone.Recorder();
    Tone.getDestination().connect(recorder);

    const transport = Tone.getTransport();
    transport.position = '0:0:0';
    transport.loop = false;

    const durationMs = Tone.Time(this.loopEnd).toSeconds() * 1000 * bars;

    recorder.start();
    this.play();

    try {
      await wait(durationMs);
      const webm = await recorder.stop();
      return await webmToMp3(webm);
    } finally {
      this.stop();
      transport.loop = true;
      transport.loopEnd = this.loopEnd;
      Tone.getDestination().disconnect(recorder);
      recorder.dispose();
    }
  }

  // --- teardown --------------------------------------------------------------

  dispose() {
    if (this.clockId !== null) {
      Tone.getTransport().clear(this.clockId);
      this.clockId = null;
    }
    for (const voice of this.voices.values()) voice.dispose();
    this.voices.clear();
    this.drawListeners.clear();
    this.playingListeners.clear();
    this.started = false;
  }

  // --- internals -------------------------------------------------------------

  private ensureClock() {
    if (this.clockId !== null) return;
    this.clockId = Tone.getTransport().scheduleRepeat(
      (time) => {
        const step = sixteenths(Tone.getTransport().position.toString());
        for (const voice of this.voices.values()) voice.tick(step, time);
        if (this.drawListeners.size > 0) {
          Tone.getDraw().schedule(() => {
            this.drawListeners.forEach((l) => l(step));
          }, time);
        }
      },
      '16n',
      '0:0:0',
    );
  }

  private emitPlaying() {
    const playing = this.isPlaying;
    this.playingListeners.forEach((l) => l(playing));
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** App-wide singleton engine. */
export const audioEngine = new AudioEngine();
