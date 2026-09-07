import { useEffect, useRef, useState } from 'react';
import type { OscillatorType } from '../../model/types';
import { SineDemo } from '../../audio/demos';
import { SineWaveGenerator } from '../../services/sine-wave-generator';
import { Modal, TutorialButton } from '../common/Modal';

import squareImg from '../../data/img/square.jpg';
import triangleImg from '../../data/img/triangle.jpg';
import sawImg from '../../data/img/saw.jpg';

const amplitudeToWave = (amp: number) => (amp + 13) * 3;
const frequencyToWave = (freq: number) => (1 / freq) * 30;

/** Introduces waveforms: play a live sine and the square/triangle/saw shapes. */
export function WaveTutorial() {
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [amplitude, setAmplitude] = useState(-2);
  const [frequency, setFrequency] = useState(440);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const demoRef = useRef<SineDemo | null>(null);
  const genRef = useRef<SineWaveGenerator | null>(null);

  useEffect(() => {
    if (!open || !canvasRef.current) return;
    const demo = new SineDemo();
    demoRef.current = demo;
    const gen = new SineWaveGenerator({ el: canvasRef.current });
    gen.addWave({
      amplitude: amplitudeToWave(amplitude),
      wavelength: frequencyToWave(frequency),
      strokeStyle: 'rgba(116,192,252,0.6)',
      speed: 0.5,
    });
    genRef.current = gen;
    return () => {
      demo.dispose();
      gen.stop();
      demoRef.current = null;
      genRef.current = null;
      setPlaying(false);
    };
    // Re-run only on open/close; slider changes are applied via the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    const wave = genRef.current?.waves[0];
    if (wave) {
      wave.amplitude = amplitudeToWave(amplitude);
      wave.wavelength = frequencyToWave(frequency);
    }
  }, [amplitude, frequency]);

  const play = (type: OscillatorType) => demoRef.current?.play(type);
  const release = () => demoRef.current?.release();

  const toggleSine = () => {
    if (playing) {
      release();
      genRef.current?.stop();
      setPlaying(false);
    } else {
      play('sine');
      genRef.current?.start();
      setPlaying(true);
    }
  };

  const holdWave = (type: OscillatorType) => ({
    onMouseDown: () => play(type),
    onMouseUp: release,
    onMouseLeave: release,
  });

  return (
    <>
      <TutorialButton onClick={() => setOpen(true)} label="Wave tutorial" />
      <Modal open={open} onClose={() => setOpen(false)} title="Waves">
        <div className="flex flex-col gap-3 leading-relaxed">
          <p>
            Synthesisers create sound using repeated, oscillating signal{' '}
            <b>waves</b>. The speed (<b>frequency</b>), volume (<b>amplitude</b>
            ) and shape (<b>waveform</b>) of the signal determine how it sounds.
            A wave that repeats more quickly has a higher pitch. The graph below
            represents amplitude over time.
          </p>

          <canvas
            ref={canvasRef}
            height={150}
            width={700}
            className="w-full rounded bg-gray-800"
          />

          <div className="flex items-center gap-2">
            <button className="btn-brand" onClick={toggleSine}>
              <i className={`fa-solid ${playing ? 'fa-pause' : 'fa-play'}`} />
            </button>
            <span>
              Click to play a sine wave. Frequencies are not to scale.
            </span>
          </div>

          <div className="flex flex-wrap justify-end gap-4">
            <label className="flex items-center gap-2">
              Frequency
              <input
                type="range"
                min={100}
                max={1000}
                step={10}
                value={frequency}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setFrequency(v);
                  demoRef.current?.setFrequency(v);
                }}
              />
            </label>
            <label className="flex items-center gap-2">
              Amplitude
              <input
                type="range"
                min={-12}
                max={5}
                step={1}
                value={amplitude}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setAmplitude(v);
                  demoRef.current?.setAmplitude(v);
                }}
              />
            </label>
          </div>

          <p>
            A <b>sine wave</b> is the most basic kind of wave. It sounds smooth
            and clean because it consists of a single frequency. Most real
            sounds are many sine waves at different frequencies: the lowest is
            the <b>fundamental frequency</b> (the perceived pitch), and the
            others — <b>partials</b> — combine to give an instrument its unique
            timbre.
          </p>

          <div className="grid grid-cols-3 gap-3">
            {(
              [
                [squareImg, 'square', 'A square wave sounds rich and buzzy.'],
                [
                  triangleImg,
                  'triangle',
                  'A triangle wave is clear and bright, between a square and a sine.',
                ],
                [
                  sawImg,
                  'sawtooth',
                  'A sawtooth wave is the buzziest, with plenty of rich partials.',
                ],
              ] as const
            ).map(([img, type, caption]) => (
              <div key={type} className="flex flex-col items-center gap-2">
                <img src={img} alt={type} className="h-20 object-contain" />
                <button className="btn-brand" {...holdWave(type)}>
                  <i className="fa-solid fa-play" />
                </button>
                <span className="text-sm">{caption}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500">Click and hold to play.</p>
        </div>
      </Modal>
    </>
  );
}
