export type MouthShape =
  'rest' | 'closed' | 'teeth' | 'wide' | 'open' | 'round' | 'puckered' | 'tongue';
export type Expression = 'neutral' | 'joy' | 'anger' | 'sadness' | 'crying' | 'laughter';

type MouthCue = readonly [time: number, shape: MouthShape];

type ExpressionCue = {
  start: number;
  expression: Expression;
};

type Caption = {
  start: number;
  end: number;
  text: string;
};

export type Scene = {
  duration: number;
  mouthCues: readonly MouthCue[];
  expressions: readonly ExpressionCue[];
  captions: readonly Caption[];
  blinks: readonly number[];
};

export type FaceFrame = {
  time: number;
  mouth: MouthShape;
  nextMouth: MouthShape;
  mouthBlend: number;
  expression: Expression;
  previousExpression: Expression;
  expressionBlend: number;
  caption: string;
  blink: number;
};

const mouthTransitionSeconds = 0.05;
const expressionTransitionSeconds = 0.28;
const blinkSeconds = 0.15;

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function blend(start: number, end: number, amount: number) {
  return start + (end - start) * amount;
}

function smoothStep(amount: number) {
  const progress = clamp(amount);
  return progress * progress * (3 - 2 * progress);
}

export function getFaceFrame(scene: Scene, playbackTime: number): FaceFrame {
  const time = clamp(playbackTime, 0, scene.duration);
  const mouthIndex = scene.mouthCues.findLastIndex(([start]) => start <= time);
  const mouth = scene.mouthCues[mouthIndex]?.[1] ?? 'rest';
  const nextMouthCue = scene.mouthCues[mouthIndex + 1];
  const mouthBlend = nextMouthCue
    ? smoothStep(1 - (nextMouthCue[0] - time) / mouthTransitionSeconds)
    : 0;
  const expressionIndex = scene.expressions.findLastIndex(({ start }) => start <= time);
  const expressionCue = scene.expressions[expressionIndex];
  const caption = scene.captions.find(({ start, end }) => start <= time && time < end);
  const blinkStart = scene.blinks.find((start) => start <= time && time < start + blinkSeconds);

  return {
    time,
    mouth,
    nextMouth: nextMouthCue?.[1] ?? mouth,
    mouthBlend,
    expression: expressionCue?.expression ?? 'neutral',
    previousExpression: scene.expressions[expressionIndex - 1]?.expression ?? 'neutral',
    expressionBlend: expressionCue
      ? smoothStep((time - expressionCue.start) / expressionTransitionSeconds)
      : 1,
    caption: caption?.text ?? '',
    blink: blinkStart === undefined ? 0 : Math.sin((Math.PI * (time - blinkStart)) / blinkSeconds),
  };
}

export function formatTime(time: number) {
  const tenths = Math.floor(time * 10);
  const minutes = Math.floor(tenths / 600);
  const seconds = Math.floor((tenths % 600) / 10);
  return `${minutes}:${String(seconds).padStart(2, '0')}.${tenths % 10}`;
}
