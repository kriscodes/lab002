# Lab002 · One voice, three faces

How much facial animation does a 2D character need for speech and emotion to read clearly? Lab002 plays one 15-second scene through three views. Switch views while it plays to compare them at the same point in the performance.

1. **Keyboard face** updates a fixed-width face drawn with keyboard characters.
2. **Mouth only** moves the cartoon character’s lips and jaw while the rest of the pose stays neutral.
3. **Full face** adds timed changes to the character’s brows, gaze, eyelids, cheeks, head, and tears.

The scene uses one bundled synthesized voice track. Timestamped mouth shapes and authored expression cues follow the audio element’s playback position. The prototype runs locally without an account or API key.

## Run locally

Use Node 22.23.4 or later.

```sh
npm ci
npm run dev
```

The dev server listens on `127.0.0.1:3002`. `npm run verify` checks formatting, lint, types, the timeline tests, and the static build. To run browser playback tests, use `npx playwright install chromium firefox webkit` once, then `npm run test:browser`.

## Files

- `app/` contains the page and responsive styles.
- `components/talking-faces.tsx` owns the player, controls, and layer selection. It reads time from the same audio element for all three layers.
- `components/keyboard-face.tsx` draws the text poses. `components/portrait.tsx` draws both cartoon layers on a Canvas 2D rig.
- `scene/timeline.ts` samples and blends cues. `scene/cues.ts` contains mouth shapes, captions, expression cues, and waveform levels for `public/mira.wav`.
- `tests/` checks the cue and audio contract, plus playback across browser engines.

## Regenerate the scene

The bundled voice is Kokoro `af_heart`. The mouth timings come from its phoneme duration output. The expression beats are authored in `scripts/generate-scene.py`.

Regeneration uses Python 3.11 with `numpy==2.4.6` and `onnxruntime==1.32.0`. Put the 8-bit `onnx/model_quantized.onnx` and `voices/af_heart.bin` from `onnx-community/Kokoro-82M-v1.0-ONNX-timestamped` revision `dd4401a9add81ac692d20e240d22ec9dda82cc29` in a local folder as `model.onnx` and `voice.bin`. Add `config.json` from `hexgrad/Kokoro-82M` revision `f3ff3571791e39611d31c381e3a41a3af07b4987` to the same folder.

```sh
python scripts/generate-scene.py /path/to/model-files
npx prettier --write scene/cues.ts
```
