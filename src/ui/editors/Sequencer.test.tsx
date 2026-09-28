import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sequencer } from './Sequencer';
import { useProjectStore } from '../../store/projectStore';
import { createProject, createSynthTrack } from '../../model/factories';
import type { SynthTrack } from '../../model/types';

let track: SynthTrack;

beforeEach(() => {
  track = createSynthTrack('Lead');
  useProjectStore.setState({
    project: createProject('Test', [track.id]),
    tracks: { [track.id]: track },
    status: 'ready',
  });
});

describe('Sequencer', () => {
  it('renders a pad for every note and step', () => {
    render(<Sequencer id={track.id} />);
    // 7 notes (C major) × 8 steps (default subdivision)
    expect(screen.getAllByRole('button')).toHaveLength(7 * 8);
  });

  it('toggles a step in the store when a pad is clicked', async () => {
    render(<Sequencer id={track.id} />);
    const pad = screen.getByLabelText('row 0 step 0');
    expect(pad).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(pad);

    const updated = useProjectStore.getState().tracks[track.id] as SynthTrack;
    expect(updated.steps[0][0]).toBe(true);
    expect(screen.getByLabelText('row 0 step 0')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
