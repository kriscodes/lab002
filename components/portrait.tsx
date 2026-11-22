import { useEffect, useRef } from 'react';
import { blend } from '../scene/timeline';
import type { Expression, FaceFrame, MouthShape } from '../scene/timeline';

const ink = '#352329';
const hair = '#392930';
const highlight = '#f5ad79';
const skin = '#d7865c';
const shadow = '#a85543';
const gold = '#f7cb71';

const illustration = {
  backHair:
    'M210 44 C152 22 109 76 114 132 C102 162 113 179 102 201 C94 223 106 249 121 257 C112 280 132 307 158 302 C169 324 204 307 214 299 C234 319 265 303 276 288 C303 287 322 263 307 239 C321 220 315 200 307 182 C323 146 303 109 295 85 C280 49 238 35 210 44Z',
  face: 'M138 148 C142 111 168 86 210 84 C252 84 280 109 283 146 L282 203 C280 243 247 276 212 279 C176 277 140 246 138 208Z',
  fringe:
    'M127 166 C105 162 106 113 116 89 C133 43 170 28 204 42 C231 27 271 40 293 73 C308 94 312 136 294 158 C291 175 298 185 292 203 C279 198 276 178 280 153 C255 145 226 117 214 91 C193 134 160 142 144 148 C145 164 140 180 130 189 C124 182 124 171 127 166Z',
  neck: 'M183 253 L183 284 C170 295 150 300 145 312 C155 349 264 349 276 311 C259 296 247 296 237 282 L237 251Z',
  neckShadow: 'M183 253 L183 274 C199 291 224 292 237 281 L237 251Z',
  shirt:
    'M55 400 C63 354 86 321 120 309 L172 290 C179 311 199 324 211 324 C225 324 247 309 250 290 L298 307 C336 321 362 355 369 400Z',
  collar:
    'M167 293 C173 314 192 332 212 333 C230 331 250 313 256 293 L247 287 C240 309 224 321 212 322 C196 319 182 305 178 288Z',
};

const poseValues = {
  neutral: {
    brow: 0,
    innerBrow: 0,
    squint: 0,
    gaze: 0,
    smile: 0,
    cheek: 0,
    tilt: 0,
    drop: 0,
    tear: 0,
    bounce: 0,
  },
  joy: {
    brow: 5,
    innerBrow: 0,
    squint: 0.32,
    gaze: 2,
    smile: 8,
    cheek: 0.32,
    tilt: -0.05,
    drop: -3,
    tear: 0,
    bounce: 0,
  },
  anger: {
    brow: -2,
    innerBrow: -11,
    squint: 0.25,
    gaze: -1,
    smile: -5,
    cheek: 0.16,
    tilt: 0.03,
    drop: -1,
    tear: 0,
    bounce: 0,
  },
  sadness: {
    brow: -3,
    innerBrow: 13,
    squint: 0.17,
    gaze: -5,
    smile: -7,
    cheek: 0,
    tilt: 0.05,
    drop: 4,
    tear: 0,
    bounce: 0,
  },
  crying: {
    brow: -3,
    innerBrow: 14,
    squint: 0.79,
    gaze: -3,
    smile: -9,
    cheek: 0.36,
    tilt: 0.07,
    drop: 6,
    tear: 1,
    bounce: 0.55,
  },
  laughter: {
    brow: 5,
    innerBrow: 1,
    squint: 0.92,
    gaze: 1,
    smile: 13,
    cheek: 0.53,
    tilt: -0.075,
    drop: -4,
    tear: 0,
    bounce: 1.8,
  },
} satisfies Record<Expression, Record<string, number>>;

type PortraitPose = (typeof poseValues)[Expression];

const mouthDimensions = {
  rest: { width: 19, height: 1, teeth: 0, tongue: 0 },
  closed: { width: 22, height: 0, teeth: 0, tongue: 0 },
  teeth: { width: 18, height: 5, teeth: 1, tongue: 0 },
  wide: { width: 27, height: 9, teeth: 0.9, tongue: 0 },
  open: { width: 21, height: 20, teeth: 0.55, tongue: 0.8 },
  round: { width: 12, height: 17, teeth: 0.2, tongue: 0.35 },
  puckered: { width: 8, height: 8, teeth: 0, tongue: 0 },
  tongue: { width: 16, height: 9, teeth: 0.45, tongue: 1 },
} satisfies Record<MouthShape, Record<string, number>>;

function coloredPath(
  context: CanvasRenderingContext2D,
  shape: string | Path2D,
  fill: string | CanvasGradient,
  outline = true,
) {
  const path = typeof shape === 'string' ? new Path2D(shape) : shape;
  context.fillStyle = fill;
  context.fill(path);
  if (outline) {
    context.strokeStyle = ink;
    context.lineWidth = 2.5;
    context.stroke(path);
  }
}

function oval(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
) {
  context.beginPath();
  context.ellipse(x, y, width, height, 0, 0, Math.PI * 2);
  context.fillStyle = color;
  context.fill();
}

function line(context: CanvasRenderingContext2D, path: string, color: string, width: number) {
  context.strokeStyle = color;
  context.lineWidth = width;
  context.stroke(new Path2D(path));
}

function getPose(frame: FaceFrame, expressive: boolean) {
  const source = expressive ? poseValues[frame.previousExpression] : poseValues.neutral;
  const target = expressive ? poseValues[frame.expression] : poseValues.neutral;
  const pose = { ...source };
  for (const feature of Object.keys(pose) as (keyof PortraitPose)[]) {
    pose[feature] = blend(source[feature], target[feature], frame.expressionBlend);
  }
  return pose;
}

function drawEyes(context: CanvasRenderingContext2D, pose: PortraitPose, blink: number) {
  for (const side of [-1, 1]) {
    const center = 210 + side * 35;
    const eyeHeight = Math.max(0.7, 9 * (1 - Math.max(pose.squint, blink)));
    const outerY = 160 - pose.brow;
    const innerY = 160 - pose.brow - pose.innerBrow;
    line(
      context,
      `M${center + side * 16} ${outerY} Q${center} ${outerY - 10} ${center - side * 15} ${innerY}`,
      hair,
      5.5,
    );
    const happySquint = Math.max(0, pose.smile - 3) * 0.35;
    const eyeY = 181;
    const eye = new Path2D(
      `M${center - 15} ${eyeY} Q${center} ${eyeY - 2 * eyeHeight - happySquint} ${center + 15} ${eyeY} Q${center} ${eyeY + 1.3 * eyeHeight - happySquint} ${center - 15} ${eyeY}Z`,
    );
    coloredPath(context, eye, '#fff0dc');
    context.save();
    context.clip(eye);
    oval(context, center + pose.gaze, eyeY, 6.4, 7.4, '#714639');
    oval(context, center + pose.gaze, eyeY, 3.5, 4.6, ink);
    oval(context, center + pose.gaze - 1.7, eyeY - 2.4, 1.45, 1.45, '#fff9ec');
    context.restore();
    line(
      context,
      `M${center - 15} ${eyeY} Q${center} ${eyeY - 2 * eyeHeight - happySquint} ${center + 15} ${eyeY}`,
      ink,
      2.8,
    );
  }
}

function drawMouth(context: CanvasRenderingContext2D, frame: FaceFrame, pose: PortraitPose) {
  const start = mouthDimensions[frame.mouth];
  const end = mouthDimensions[frame.nextMouth];
  const width = blend(start.width, end.width, frame.mouthBlend) + Math.max(0, pose.smile) * 0.2;
  const height = blend(start.height, end.height, frame.mouthBlend);
  const teeth = blend(start.teeth, end.teeth, frame.mouthBlend);
  const tongue = blend(start.tongue, end.tongue, frame.mouthBlend);
  const center = 210;
  const y = 232;
  const corner = y - pose.smile;

  const mouth = new Path2D(
    `M${center - width} ${corner} Q${center} ${y - height * 0.7} ${center + width} ${corner} Q${center} ${y + height * 1.7} ${center - width} ${corner}Z`,
  );
  coloredPath(context, mouth, '#4c2332');
  context.save();
  context.clip(mouth);
  if (teeth > 0) {
    oval(
      context,
      center,
      y - height * 0.58 - 1,
      width * 0.86,
      2 + height * teeth * 0.64,
      '#fff0dc',
    );
  }
  if (tongue > 0) {
    oval(context, center, y + height * 0.87, width * 0.63, height * tongue * 0.38, '#df826f');
  }
  context.restore();
  line(
    context,
    `M${center - width * 0.45} ${y + height + 6} Q${center} ${y + height + 9} ${center + width * 0.45} ${y + height + 6}`,
    shadow,
    1.9,
  );
}

function drawPortrait(
  context: CanvasRenderingContext2D,
  frame: FaceFrame,
  expressive: boolean,
  reducedMotion: boolean,
) {
  const pose = getPose(frame, expressive);
  context.clearRect(0, 0, 420, 380);
  context.lineCap = 'round';
  context.lineJoin = 'round';
  coloredPath(context, illustration.backHair, hair);
  coloredPath(context, illustration.neck, skin);
  coloredPath(context, illustration.neckShadow, shadow, false);
  coloredPath(context, illustration.shirt, '#6c4939');
  coloredPath(context, illustration.collar, '#af7254', false);
  line(context, 'M120 320 Q149 334 155 389 M300 320 Q271 334 265 389', '#4f3334', 2.1);
  line(context, 'M82 371 Q132 350 149 353 M337 371 Q289 350 273 353', '#8b5946', 1.4);

  const headBounce = reducedMotion ? 0 : Math.sin(frame.time * 22) * pose.bounce;
  context.save();
  context.translate(210, 211 + (reducedMotion ? 0 : pose.drop + headBounce));
  context.rotate(reducedMotion ? 0 : pose.tilt);
  context.translate(-210, -211);

  for (const side of [-1, 1]) {
    const ear = 210 + side * 74;
    oval(context, ear, 194, 13.5, 21, shadow);
    oval(context, ear + side * 3, 194, 6, 12, skin);
    oval(context, ear + side * 4, 211, 4, 4, gold);
    line(context, `M${ear + side * 4} 212 a7 10 0 1 0 0 18 a7 10 0 1 0 0 -18`, gold, 2.6);
  }

  const skinLight = context.createLinearGradient(143, 114, 281, 275);
  skinLight.addColorStop(0, highlight);
  skinLight.addColorStop(0.58, skin);
  skinLight.addColorStop(1, '#bb674d');
  coloredPath(context, illustration.face, skinLight);
  coloredPath(context, illustration.fringe, hair);
  line(
    context,
    'M127 136 C125 88 162 49 196 55 C173 66 155 88 149 106 M219 55 C240 48 283 82 286 114 M228 73 C240 98 267 120 287 127',
    '#604149',
    2.3,
  );
  line(context, 'M118 208 Q108 226 125 243 M302 213 Q318 231 294 256', '#604149', 2.1);
  drawEyes(context, pose, expressive && !reducedMotion ? frame.blink : 0);
  line(context, 'M211 180 C208 191 201 199 203 204 Q207 209 216 205', shadow, 2.3);
  oval(context, 211, 196, 2, 4, '#e89a69');
  for (const side of [-1, 1]) {
    const cheekX = 210 + side * 48;
    oval(context, cheekX, 207, 15, 6, `rgba(177, 59, 69, ${0.18 + pose.cheek})`);
    oval(context, cheekX - 6, 202, 1.15, 1.1, shadow);
    oval(context, cheekX, 200, 1.1, 1.1, shadow);
    oval(context, cheekX + 5, 204, 1.25, 1.15, shadow);
  }
  drawMouth(context, frame, pose);

  if (pose.tear > 0.05) {
    context.globalAlpha = pose.tear;
    const tearY = reducedMotion ? 206 : 190 + ((frame.time * 30) % 45);
    oval(context, 248, tearY, 3, 6, '#b4dce8');
    oval(context, 247, tearY - 2, 0.9, 2, '#fffefa');
  }
  context.restore();
}

export function Portrait({ frame, expressive }: { frame: FaceFrame; expressive: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const context = canvas.current?.getContext('2d');
    if (context) {
      context.setTransform(2, 0, 0, 2, 0, 0);
      drawPortrait(
        context,
        frame,
        expressive,
        matchMedia('(prefers-reduced-motion: reduce)').matches,
      );
    }
  }, [expressive, frame]);

  return <canvas ref={canvas} className="portrait" width={840} height={760} aria-hidden="true" />;
}
