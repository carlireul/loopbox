import { useState } from 'react';
import { Modal, TutorialButton } from '../common/Modal';
import { useClipPlayer } from './useClipPlayer';
import { PlayButton } from './PlayButton';

import reverb from '../../data/audio/reverb.mp3';
import delay from '../../data/audio/delay.mp3';
import eq from '../../data/audio/eq.mp3';
import noeq from '../../data/audio/no_eq.mp3';
import distortion from '../../data/audio/distortion.mp3';

const CLIPS = { reverb, delay, eq, noeq, distortion };

/** Explains EQ and the wet/dry effects with before/after audio examples. */
export function EffectTutorial() {
  const [open, setOpen] = useState(false);
  const { ready, playing, toggle } = useClipPlayer(CLIPS, open);
  const btn = (name: keyof typeof CLIPS) => (
    <PlayButton
      active={playing === name}
      disabled={!ready}
      onClick={() => toggle(name)}
    />
  );

  return (
    <>
      <TutorialButton onClick={() => setOpen(true)} label="Effects tutorial" />
      <Modal open={open} onClose={() => setOpen(false)} title="EQ + Effects">
        <div className="flex flex-col gap-3 leading-relaxed">
          <p>
            Producers use various effects to alter the sound of synths and
            drums. It&apos;s common to split an audio source into two channels:
            the <b>dry</b> channel has no effect applied, while the <b>wet</b>{' '}
            channel does, and the two are combined in different proportions. At
            0% wet the effect is ignored; at 100% wet only the affected channel
            is heard.
          </p>
          <p className="flex items-center gap-2">
            {btn('reverb')}
            <span>
              <b>Reverb</b> simulates a sound reflecting off a surface and
              slowly decaying, like in a large hall or church.
            </span>
          </p>
          <p className="flex items-center gap-2">
            {btn('delay')}
            <span>
              <b>Delay</b> records an input and plays it back after a short time
              (usually synced to the beat). Mixed with the original it creates
              an echo; fed back in, a repeated decaying echo.
            </span>
          </p>
          <p className="flex items-center gap-2">
            {btn('distortion')}
            <span>
              <b>Distortion</b> reshapes an incoming signal to create an
              aggressive effect, also common on guitars in rock music.
            </span>
          </p>
          <p className="flex items-center gap-2">
            {btn('noeq')}
            {btn('eq')}
            <span>
              <b>EQ</b> alters the gain of different frequency bands. This EQ
              uses 3 bands — low, mid and high. Play the <b>No EQ</b> then{' '}
              <b>EQ</b> clips to compare.
            </span>
          </p>
        </div>
      </Modal>
    </>
  );
}
