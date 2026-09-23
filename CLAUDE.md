# loopbox

A browser DAW (drum machine / synth / sampler / audio-clip sequencer) built on Tone.js.
Educational tutorials explain synthesis concepts (waves, ADSR, filters, effects, drum patterns).

## Strangler rebuild

This TS app replaces the old JS version still on `main`. `REBUILD_PLAN.md` holds the plan
and current phase status.

The old app (`main:src/components/*.jsx`) is the behavior reference when porting — diff against it.

## Commands

```
npm run dev           # Vite dev server (localhost:5173)
npm run typecheck     # tsc --noEmit (strict)
npm run lint          # eslint, zero warnings allowed
npm run format:check  # prettier
npm run test          # vitest (jsdom); test:watch for watch mode
npm run build         # vite build (+ PWA)
```

CI runs typecheck + lint + format:check + test + build on every push. Run all of these before
committing.

## Architecture — one-way data flow

**Model → Store → Engine → UI.** The core lesson of the rewrite: keep Tone.js (DSP) out of React.

- `src/model/` — TS types + factories. `Track` is a discriminated union: `SynthTrack | SamplerTrack | AudioTrack` (`types.ts`).
- `src/data/` — **Dexie (IndexedDB) is the single source of truth.** `database.ts` schema, `projects.ts` CRUD (`useLiveQuery`), `samples.ts` drum-kit data.
- `src/store/projectStore.ts` — **Zustand + immer.** Typed actions (`updateEnvelope`, `toggleMute`, …) mutate the loaded project; `mutate(set, id, recipe)` is the per-track helper. This is what components read/write.
- `src/audio/` — framework-agnostic audio engine (no React):
  - `AudioEngine.ts` — singleton; owns the Tone transport + one shared 16th-note clock; `setTracks()` reconciles voices.
  - `voices.ts` / `VoiceChain.ts` — one voice per track type; builds/updates/disposes its own Tone graph.
  - `useEngine.ts` — the **only** bridge: `useEngineSync()` pushes store state into the engine; `useTransport()`/`useDrawIndex()` read engine state. Mounted once in `Daw`.
  - `demos.ts` — throwaway Tone players used _only_ by tutorials (kept out of components on purpose).
  - `export.ts` — ffmpeg.wasm WebM→MP3 render.
- `src/ui/` — React + **Tailwind** (no Bootstrap in the new app). `App` → `ProjectPicker` | `Daw`. Editors in `editors/`, per-track overview UI in `tracks/`, tutorials in `tutorials/`, shared bits in `common/`.

## Gotchas worth knowing

- **AudioContext unlock:** `audioEngine.start()` (which calls `Tone.start()`) must run from a user gesture. It's called on the project-open click in `ProjectPicker` — there is deliberately no "Start" button.
- **Tone mute:** `Channel.mute` is implemented as `volume = -Infinity`, so always apply mute _after_ setting volume (see `VoiceChain.applyControls`).
- **Engine teardown:** leaving the DAW must `audioEngine.dispose()` (stops transport + disposes voices); `useEngineSync`'s unmount cleanup does this.
- **Value snapping:** never display a raw float param — snap writes to the grid and format for display (see `drawEnvelope.ts` `snap`/`fmt`).
- Vendored JS (`src/services/*.js`) has hand-written `.d.ts` siblings since `allowJs` is off.
