// Ambient types for the vendored sine-wave-generator.js (used only by the
// synth tutorials). Declares just the surface the tutorials touch.
export interface WaveConfig {
  phase?: number;
  speed?: number;
  amplitude?: number;
  wavelength?: number;
  strokeStyle?: string;
  segmentLength?: number;
  rotate?: number;
}

export interface Wave {
  amplitude: number;
  wavelength: number;
}

export class SineWaveGenerator {
  waves: Wave[];
  constructor(options: {
    el: HTMLCanvasElement | string;
    waves?: WaveConfig[];
  });
  addWave(config: WaveConfig): void;
  removeWave(index: number): void;
  start(): void;
  stop(): void;
}
