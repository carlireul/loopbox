import coreURL from '@ffmpeg/core?url';
import wasmURL from '@ffmpeg/core/wasm?url';
import { FFmpeg } from '@ffmpeg/ffmpeg';

/**
 * Transcode a recorded WebM blob to MP3 using ffmpeg.wasm. Ported from the
 * legacy `helpers.convertWebmToMp3`, unchanged in behaviour.
 */
export async function webmToMp3(webm: Blob): Promise<Blob> {
  const ffmpeg = new FFmpeg();
  await ffmpeg.load({ coreURL, wasmURL });

  const input = 'input.webm';
  const output = 'output.mp3';

  const inputBytes = new Uint8Array(await webm.arrayBuffer());
  await ffmpeg.writeFile(input, inputBytes);
  await ffmpeg.exec(['-i', input, output]);

  const data = await ffmpeg.readFile(output);
  const view = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  // Copy into a fresh (non-shared) buffer so the result is a valid BlobPart.
  const bytes = new Uint8Array(view.byteLength);
  bytes.set(view);
  return new Blob([bytes], { type: 'audio/mp3' });
}
