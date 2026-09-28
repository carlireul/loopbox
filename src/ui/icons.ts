// Self-hosted FontAwesome, bundled to only the icons we actually use.
//
// We register the used solid icons into the library and let `dom.watch()`
// replace the existing `<i className="fa-solid fa-…">` markup with inline SVG
// at runtime (it also re-processes elements React adds or re-renders, so the
// dynamic play/pause and volume-level toggles keep working). This replaces the
// old external kit.fontawesome.com <script>, which broke offline and would be
// blocked under the app's cross-origin-isolation (COEP) policy.
import { config, dom, library } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import {
  faCheck,
  faDrum,
  faFileAudio,
  faHeadphones,
  faLeftRight,
  faMagnifyingGlass,
  faMusic,
  faPause,
  faPlay,
  faPlus,
  faRotateRight,
  faStop,
  faVolumeHigh,
  faVolumeLow,
  faVolumeOff,
  faVolumeXmark,
  faWaveSquare,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';

// We import the stylesheet ourselves (above); stop the library from also
// injecting it, which would race with our import and CSP.
config.autoAddCss = false;

library.add(
  faCheck,
  faDrum,
  faFileAudio,
  faHeadphones,
  faLeftRight,
  faMagnifyingGlass,
  faMusic,
  faPause,
  faPlay,
  faPlus,
  faRotateRight,
  faStop,
  faVolumeHigh,
  faVolumeLow,
  faVolumeOff,
  faVolumeXmark,
  faWaveSquare,
  faXmark,
);

// Replace existing <i> markup now and keep watching for DOM changes.
dom.watch();
