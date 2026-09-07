import { useState } from 'react';
import { Modal, TutorialButton } from '../common/Modal';
import { useClipPlayer } from './useClipPlayer';
import { PlayButton } from './PlayButton';

import drumnbass from '../../data/audio/drumnbass.mp3';
import hiphop from '../../data/audio/hiphop.mp3';
import house from '../../data/audio/house.mp3';
import twobeat from '../../data/audio/twobeat.mp3';
import fouronthefloor from '../../data/audio/fouronthefloor.mp3';

const CLIPS = { drumnbass, hiphop, house, twobeat, fouronthefloor };

/** Explains the sequencer and common drum patterns with playable examples. */
export function DrumTutorial() {
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
      <TutorialButton onClick={() => setOpen(true)} label="Drum tutorial" />
      <Modal open={open} onClose={() => setOpen(false)} title="Drums">
        <div className="flex flex-col gap-3 leading-relaxed">
          <p>
            The <b>sequencer</b> is where you place the notes/drum hits you want
            played. One loop of the sequencer is a <b>bar</b>, and there are{' '}
            <b>4 beats</b> in a bar. You can divide the bar into quarter, eighth
            or sixteenth notes.
          </p>
          <p>
            Drum beats are the backbone of electronic music. Different genres
            can be distinguished by their drum beats. Here are some common{' '}
            <b>drum patterns</b> to inspire you.
          </p>
          <p className="flex items-center gap-2">
            {btn('fouronthefloor')}
            <span>
              <b>Four-on-the-floor</b> is one of the most fundamental patterns:
              a kick drum on every beat.
            </span>
          </p>
          <p className="flex items-center gap-2">
            {btn('twobeat')}
            <span>
              <b>Two beat</b> has a kick on the 1st and 3rd beats, and a snare
              on the 2nd and 4th.
            </span>
          </p>
          <p className="flex items-center gap-2">
            {btn('house')}
            <span>
              <b>House</b> music uses the classic four-on-the-floor pattern,
              plus a clap on the 2nd and 4th beats and hi-hats on every 8th
              note.
            </span>
          </p>
          <p className="flex items-center gap-2">
            {btn('drumnbass')}
            <span>
              <b>Drum &apos;n&apos; bass</b> is based on a fast 2-step rhythm of
              snares on the 2nd and 4th beats, kicks on the first and sixth 8th
              notes, plus hi-hats on the 8th notes.
            </span>
          </p>
          <p className="flex items-center gap-2">
            {btn('hiphop')}
            <span>
              Classic <b>hip-hop</b> builds off the two-beat pattern by adding
              extra kicks and hi-hats between the beats.
            </span>
          </p>
        </div>
      </Modal>
    </>
  );
}
