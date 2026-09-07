# loopbox — Rebuild Plan

## Verdict: architectural rewrite, presentation reproduced

Not a from-scratch redesign, and not an in-place refactor. The two central abstractions —
the monolithic mutable `TrackContext` god-object and the 380-line `useTrack` `switch(type)`
hook — touch nearly every file, and there is **no test net** to make in-place surgery safe.
So a "heavy refactor" collapses into a rewrite anyway.

Strategy: **strangler rebuild** on a branch. Fresh TypeScript scaffold with a clean state +
audio-engine core; reproduce the UI/UX (which is good) rather than the internals (which are not).
Keep the old app running on `main` and cut components over incrementally, diffing behavior
against it.

## Decisions (locked)

- **State:** Zustand + immer (kills the deep-spread updates and the type-switch hook).
- **Persistence:** Dexie is the single source of truth; React state derived via `useLiveQuery`.
- **Migration:** Clean slate — bump the DB, re-seed, no legacy migration.
- **Styling:** Migrate Bootstrap → **Tailwind + CSS modules**. Goal is to _reproduce_ the current
  look/feel, not redesign it. ⚠️ This is the main UI-regression risk in the whole plan — treat it
  as a deliberate phase with side-by-side visual comparison against the old app.

## What to keep vs. replace

| Keep (port over)                            | Replace / rebuild                                 |
| ------------------------------------------- | ------------------------------------------------- |
| Component markup structure & UX flows       | `TrackContext` god-object → Zustand store         |
| Tone.js signal-chain knowledge              | `useTrack` type-switch → typed actions            |
| Sample library (`data/samples`) & tutorials | Hand-synced dual state → Dexie-derived            |
| ffmpeg.wasm MP3 export, PWA config          | Bootstrap classes → Tailwind                      |
| Waveform stack (konva/peaks/waveform-data)  | In-component Tone.js graphs → AudioEngine service |

## Known bugs / debt to fix in passing

- `resetEQ` references `state[id].effectseq` (typo) in `useTrack.jsx`.
- `TrackContext.jsx` populates `tracks = {}` in an async effect while `useState(tracks)` captures
  the empty reference — a race that works by luck. Fix via Dexie-derived state.
- Seed data copy-pasted between Dexie `upgrade` and `populate` in `db.js` — unify into one module.
- Dead commented-out "clips" feature across ~6 files; `console.log`s throughout.
- Stray untracked `index.ts` (Bun experiment) — delete.
- `package.json` name is `"test"` — rename to `loopbox`.

## Phases

### Phase 0 — Scaffold & CI (green pipeline from commit 1)

- Fresh Vite + React + **TypeScript** (strict). Rename package `test` → `loopbox`. Delete `index.ts`.
- ESLint (typescript-eslint) + Prettier.
- **Vitest** + React Testing Library (jsdom) + one smoke test.
- Install & configure **Tailwind**; establish the design tokens (colors incl. `#74C0FC`, spacing,
  fonts) that match the current look.
- **GitHub Actions:** typecheck + lint + test + build on every PR. Vercel for deploy
  (PR previews + prod on `main`).

### Phase 1 — Model & persistence (the core fix)

- TS types: `Project`, `Track` as a discriminated union (`SynthTrack | SamplerTrack | AudioTrack`),
  `Effects`, `Envelope`, `Filter`, etc.
- Zustand store with immer; typed actions replace the ~30 near-identical setters.
- Dexie as single source of truth; one clean seeding module + versioned schema (clean-slate bump).
- Unit-test store actions, seeding, and migration.

### Phase 2 — Audio engine as a service (decouple DSP from React)

- Framework-agnostic `AudioEngine`: owns the transport; one `TrackVoice` per track type that
  builds / updates / disposes its own Tone.js chain.
- Components call `engine.updateTrack(id, patch)`; no Tone.js `useRef`/`useEffect` graphs in
  components.
- Unit-test schedulable logic (`getBeat`, step→note mapping); smoke-test node lifecycle.

### Phase 3 — Port the UI (Tailwind)

- Rebuild components against the new store/engine, reproducing markup/UX in Tailwind + CSS modules.
- Order: `TrackControls` → `SynthTrack` → `SamplerTrack` → `AudioTrack` → tabs/`DAW` → tutorials.
- Drop dead code and `console.log`s per file as ported.
- Keep react-tabs (or replace), react-tooltip, tutorials, PWA, ffmpeg export.
- Visual QA each screen against the old app before deleting the old version.

### Phase 4 — Harden & finish

- Component tests for key flows (add track, toggle step, param persists).
- Error boundaries; guard IndexedDB init.
- README, contributing notes.
- Optional/later: lighten waveform deps; revisit component library.

## Sequencing

Build on a branch in parallel with `main`; cut components over incrementally so a working app
exists throughout and behavior can be diffed against the current one.
