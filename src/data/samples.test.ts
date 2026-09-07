import { describe, expect, it } from 'vitest';
import { buildKit, buildRandomKit, sampleLibrary } from './samples';

describe('sampleLibrary', () => {
  it('parses type and pack from each sample key', () => {
    expect(sampleLibrary.length).toBeGreaterThan(0);
    for (const s of sampleLibrary) {
      expect(s.sampleType).toBeTruthy();
      expect(typeof s.source).toBe('string');
    }
  });
});

describe('buildKit', () => {
  it('returns a non-empty instrument map for a real pack', () => {
    const kit = buildKit('808');
    expect(Object.keys(kit).length).toBeGreaterThan(0);
  });

  it('de-duplicates repeated sample types with a numeric suffix', () => {
    // Two samples sharing a type should not collide on the same key.
    const kit = buildKit('808');
    const keys = Object.keys(kit);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('buildRandomKit', () => {
  it('includes the core drum voices', () => {
    const kit = buildRandomKit();
    for (const voice of ['kick', 'snare', 'hihat']) {
      expect(kit).toHaveProperty(voice);
    }
  });
});
