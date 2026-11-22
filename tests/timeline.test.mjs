import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { miraScene } from '../scene/cues.ts';
import { getFaceFrame } from '../scene/timeline.ts';

const twoLines = {
  duration: 3,
  mouthCues: [
    [0, 'rest'],
    [0.5, 'closed'],
    [0.7, 'open'],
    [0.9, 'rest'],
  ],
  expressions: [
    { start: 0, expression: 'neutral' },
    { start: 1, expression: 'joy' },
  ],
  captions: [{ start: 0.4, end: 0.9, text: 'Hi.' }],
  blinks: [0.2],
};

test('mouth cues follow the playback position and blend into the next shape', () => {
  const transition = getFaceFrame(twoLines, 0.675);
  assert.equal(transition.mouth, 'closed');
  assert.equal(transition.nextMouth, 'open');
  assert.ok(transition.mouthBlend > 0.45 && transition.mouthBlend < 0.55);
  assert.equal(getFaceFrame(twoLines, 0.7).mouth, 'open');
  assert.equal(getFaceFrame(twoLines, 0.2).mouth, 'rest');
});

test('a seek samples captions, expressions, and blinks at the requested time', () => {
  assert.equal(getFaceFrame(twoLines, 0.6).caption, 'Hi.');
  assert.equal(getFaceFrame(twoLines, 0.9).caption, '');
  assert.ok(getFaceFrame(twoLines, 0.275).blink > 0.95);
  const expression = getFaceFrame(twoLines, 1.14);
  assert.equal(expression.previousExpression, 'neutral');
  assert.equal(expression.expression, 'joy');
  assert.ok(expression.expressionBlend > 0.45 && expression.expressionBlend < 0.55);
  assert.equal(getFaceFrame(twoLines, 4).time, 3);
  assert.equal(getFaceFrame(twoLines, -1).time, 0);
});

test('the bundled voice and cue track have matching durations and sorted cues', async () => {
  const wav = await readFile(new URL('../public/mira.wav', import.meta.url));
  assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
  assert.equal(wav.toString('ascii', 36, 40), 'data');
  assert.equal(wav.readUInt32LE(40) / wav.readUInt32LE(28), miraScene.duration);
  assert.equal(miraScene.duration, 15);
  assert.ok(
    miraScene.mouthCues.every(
      ([time], index, all) =>
        time <= miraScene.duration && (index === 0 || time > all[index - 1][0]),
    ),
  );
  assert.equal(getFaceFrame(miraScene, 15).mouth, 'rest');
  assert.equal(getFaceFrame(miraScene, 15).expression, 'neutral');
});
