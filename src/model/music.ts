/** The twelve chromatic note names, used to build scale and root menus. */
export const NOTE_NAMES = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
] as const;

/** Major/minor scales for every root, e.g. "C major", "C minor". */
export const SCALE_OPTIONS: string[] = NOTE_NAMES.flatMap((note) => [
  `${note} major`,
  `${note} minor`,
]);
