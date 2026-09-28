import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

/**
 * Phase 0 smoke test — proves the TS + Vitest + RTL + jsdom pipeline is wired
 * up and green in CI. Replaced by real store/engine/component tests as the
 * rebuild lands (see REBUILD_PLAN.md).
 */
function Hello({ name }: { name: string }) {
  return <h1>Hello, {name}</h1>;
}

describe('toolchain smoke test', () => {
  it('renders a component through React Testing Library', () => {
    render(<Hello name="loopbox" />);
    expect(
      screen.getByRole('heading', { name: 'Hello, loopbox' }),
    ).toBeInTheDocument();
  });

  it('runs TypeScript with strict types', () => {
    const sum = (a: number, b: number): number => a + b;
    expect(sum(2, 3)).toBe(5);
  });
});
