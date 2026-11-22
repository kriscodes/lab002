import { expect, test } from '@playwright/test';

function readPlayback(audio: HTMLAudioElement) {
  return {
    time: audio.currentTime,
    paused: audio.paused,
    duration: audio.duration,
    muted: audio.muted,
  };
}

test('one audio element keeps playing when the face changes', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  const audio = page.locator('audio');
  const originalPlayer = await audio.elementHandle();
  const stage = page.locator('.stage');
  const play = page.getByRole('button', { name: 'Play', exact: true });
  const pause = page.getByRole('button', { name: 'Pause', exact: true });

  await expect(stage).toHaveAttribute('data-layer', 'full');
  await expect.poll(async () => (await audio.evaluate(readPlayback)).duration).toBe(15);
  await play.click();
  await expect(pause).toBeVisible();
  await expect(page.locator('.caption-strip')).toContainText("Hi, I'm Mira.");
  const before = await audio.evaluate(readPlayback);

  await page.getByText('Keyboard face', { exact: true }).click();
  await expect(stage).toHaveAttribute('data-layer', 'keyboard');
  await expect(stage.locator('pre')).toBeVisible();
  await page.getByText('Mouth only', { exact: true }).click();
  await expect(stage).toHaveAttribute('data-layer', 'mouth');
  await expect(stage.locator('canvas')).toBeVisible();
  await page.getByText('Full face', { exact: true }).click();
  await expect(stage).toHaveAttribute('data-layer', 'full');
  await expect
    .poll(async () => (await audio.evaluate(readPlayback)).time)
    .toBeGreaterThan(before.time);
  expect(await audio.evaluate((element, original) => element === original, originalPlayer)).toBe(
    true,
  );
  expect((await audio.evaluate(readPlayback)).paused).toBe(false);

  const mute = page.getByRole('button', { name: 'Mute audio' });
  await mute.click();
  await expect(mute).toHaveAttribute('aria-pressed', 'true');
  expect((await audio.evaluate(readPlayback)).muted).toBe(true);
  await pause.click();
  await expect(play).toBeVisible();
  expect((await audio.evaluate(readPlayback)).paused).toBe(true);
  expect(errors).toEqual([]);
});

test('the transcript and keyboard scrubber seek without restarting playback', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const audio = page.locator('audio');
  const slider = page.getByRole('slider', { name: 'Scene position' });
  const play = page.getByRole('button', { name: 'Play', exact: true });
  await expect.poll(async () => (await audio.evaluate(readPlayback)).duration).toBe(15);
  await page.getByText('Scene transcript', { exact: true }).click();
  await page.getByRole('button', { name: /I almost cried/ }).click();
  await expect(page.locator('.caption-strip')).toContainText('I almost cried.');
  expect((await audio.evaluate(readPlayback)).time).toBeCloseTo(8.85, 2);
  await expect(play).toBeVisible();
  await slider.press('End');
  await expect(slider).toHaveValue('15');
  await page.getByRole('button', { name: 'Replay' }).click();
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  expect((await audio.evaluate(readPlayback)).time).toBeLessThan(1);
  await page.getByText('Keyboard face', { exact: true }).click();
  const stage = page.locator('.stage');
  const keyboardFace = stage.locator('pre');
  await expect(keyboardFace).toBeVisible();
  const stageBox = await stage.boundingBox();
  const faceBox = await keyboardFace.boundingBox();
  expect(stageBox).not.toBeNull();
  expect(faceBox).not.toBeNull();
  if (!stageBox || !faceBox) return;
  const stageCenter = stageBox.x + stageBox.width / 2;
  const faceCenter = faceBox.x + faceBox.width / 2;
  expect(faceCenter).toBeCloseTo(stageCenter, 0);
  await page.getByRole('radio', { name: 'Keyboard face', exact: true }).press('ArrowRight');
  await expect(stage).toHaveAttribute('data-layer', 'mouth');
  expect(await page.locator('body').evaluate((body) => body.scrollWidth)).toBe(390);
});
