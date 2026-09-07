import { describe, expect, it } from 'vitest';
import { eighths, getBeat, parsePosition, quarters, sixteenths } from './beat';

describe('parsePosition', () => {
  it('parses bars:quarters:sixteenths', () => {
    expect(parsePosition('1:2:3')).toEqual([1, 2, 3]);
  });
  it('floors fractional sixteenths', () => {
    expect(parsePosition('0:0:2.5')).toEqual([0, 0, 2]);
  });
});

describe('bar subdivisions', () => {
  it('computes the sixteenth index within a bar (0-15)', () => {
    expect(sixteenths('0:0:0')).toBe(0);
    expect(sixteenths('0:1:0')).toBe(4);
    expect(sixteenths('0:3:3')).toBe(15);
  });
  it('computes the eighth index (0-7)', () => {
    expect(eighths('0:0:0')).toBe(0);
    expect(eighths('0:1:0')).toBe(2);
    expect(eighths('0:3:2')).toBe(7);
  });
  it('computes the quarter index (0-3)', () => {
    expect(quarters('0:2:0')).toBe(2);
  });
});

describe('getBeat', () => {
  it('selects the right index for each subdivision', () => {
    expect(getBeat('0:3:3', 4)).toBe(3);
    expect(getBeat('0:3:3', 8)).toBe(7);
    expect(getBeat('0:3:3', 16)).toBe(15);
  });
});
