import type { Expression, FaceFrame, MouthShape } from '../scene/timeline';

const mouths: Record<MouthShape, string> = {
  rest: ' ___ ',
  closed: ' --- ',
  teeth: ' ### ',
  wide: ' === ',
  open: '  O  ',
  round: '  o  ',
  puckered: '  0  ',
  tongue: '  ~  ',
};

const expressions: Record<
  Expression,
  { brows: string; eyes: string; cheeks: string; restMouth: string }
> = {
  neutral: { brows: ' --     -- ', eyes: ' @       @ ', cheeks: '           ', restMouth: ' ___ ' },
  joy: {
    brows: ' ^^     ^^ ',
    eyes: ' ^       ^ ',
    cheeks: ' *       * ',
    restMouth: ' \\___/ ',
  },
  anger: {
    brows: ' \\\\     // ',
    eyes: ' @       @ ',
    cheeks: '           ',
    restMouth: ' --- ',
  },
  sadness: {
    brows: ' //     \\\\ ',
    eyes: ' o       o ',
    cheeks: '           ',
    restMouth: ' /---\\ ',
  },
  crying: {
    brows: ' //     \\\\ ',
    eyes: ' -       - ',
    cheeks: ' *       * ',
    restMouth: '  ~  ',
  },
  laughter: {
    brows: ' ^^     ^^ ',
    eyes: ' ^       ^ ',
    cheeks: ' *       * ',
    restMouth: '  O  ',
  },
};

export function KeyboardFace({ frame }: { frame: FaceFrame }) {
  const pose = expressions[frame.expression];
  const mouthShape = frame.mouthBlend >= 0.5 ? frame.nextMouth : frame.mouth;
  const mouth = (mouthShape === 'rest' ? pose.restMouth : mouths[mouthShape])
    .trim()
    .padStart(3)
    .padEnd(5);
  const eyes = frame.blink > 0.7 ? ' -       - ' : pose.eyes;
  const face = [
    '    .-----------.    ',
    '  /               \\  ',
    ' /                 \\ ',
    `|    ${pose.brows}    |`,
    `|    ${eyes}    |`,
    '(|        ^        |)',
    `|    ${pose.cheeks}    |`,
    ` \\      ${mouth}      / `,
    '  \\               /  ',
    "    `-----------'    ",
  ].join('\n');

  return (
    <pre className="keyboard-face" aria-hidden="true">
      {face}
    </pre>
  );
}
