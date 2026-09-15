/**
 * WCAG 1.4.3 guard for Badge labels.
 *
 * This reads the colours off the ACTUALLY RENDERED node rather than from a table
 * copied out of the component, so editing Badge.tsx moves this test. A guard that
 * restates its own constants cannot fail.
 *
 * Badge text is 12px (Badge.tsx styles.text), which is "normal" text under WCAG,
 * so the threshold is 4.5:1 -- not the 3:1 that applies to the fills and borders.
 *
 * Origin: a Task 23 typecheck fix changed the MovieRail "No AD Track" badge from
 * the `default` variant (5.33:1) to `skipped`, which rendered its label in the
 * #64748B fill token at 3.13:1 on a resting card and 2.72:1 on a focused one.
 * On a 10-foot TV UI, focused is the normal state.
 */
import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { Badge, BadgeVariant } from '../src/shared/Badge';
import { colors } from '../src/core/theme';

const AA_NORMAL = 4.5;

/** Every surface a Badge is actually placed on in this app. */
const SURFACES: Record<string, string> = {
  background: colors.background,
  surface: colors.surface,
  surfaceHover: colors.surfaceHover,
  surfaceElevated: colors.surfaceElevated
};

type RGBA = { r: number; g: number; b: number; a: number };

function parseColor(input: string): RGBA {
  const s = input.trim();
  const rgba = s.match(/^rgba?\(([^)]+)\)$/i);
  if (rgba) {
    const p = rgba[1].split(',').map(v => parseFloat(v.trim()));
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }
  const h = s.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
    a: 1
  };
}

function composite(fg: RGBA, bg: RGBA): RGBA {
  return {
    r: fg.a * fg.r + (1 - fg.a) * bg.r,
    g: fg.a * fg.g + (1 - fg.a) * bg.g,
    b: fg.a * fg.b + (1 - fg.a) * bg.b,
    a: 1
  };
}

function luminance(c: RGBA): number {
  const ch = (v: number) => {
    const x = v / 255;
    return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * ch(c.r) + 0.7152 * ch(c.g) + 0.0722 * ch(c.b);
}

function contrast(a: RGBA, b: RGBA): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

type TestInstance = ReturnType<typeof render>['UNSAFE_root'];

/** Pulls the real text colour and real container fill out of a rendered Badge. */
function renderedColors(variant: BadgeVariant) {
  const { UNSAFE_root } = render(<Badge label="Sample Label" variant={variant} />);
  const isHost = (name: string) => (n: TestInstance) => n.type === name;
  const text = UNSAFE_root.findAll(isHost('Text'))[0];
  const view = UNSAFE_root.findAll(isHost('View'))[0];

  const textStyle = StyleSheet.flatten(text.props.style) as { color?: string };
  const viewStyle = StyleSheet.flatten(view.props.style) as { backgroundColor?: string };

  expect(typeof textStyle.color).toBe('string');
  expect(typeof viewStyle.backgroundColor).toBe('string');

  return {
    textColor: textStyle.color as string,
    fill: viewStyle.backgroundColor as string
  };
}

const ALL_VARIANTS: BadgeVariant[] = [
  'ai-draft',
  'verified',
  'skipped',
  'pre-generated',
  'dialogue',
  'default'
];

describe('Badge label contrast (WCAG 1.4.3, 12px => 4.5:1)', () => {
  it.each(ALL_VARIANTS)(
    'variant "%s" label meets AA on every surface the badge is used on',
    variant => {
      const { textColor, fill } = renderedColors(variant);
      const fg = parseColor(textColor);

      const failures: string[] = [];
      for (const [name, surfaceHex] of Object.entries(SURFACES)) {
        const effectiveBg = composite(parseColor(fill), parseColor(surfaceHex));
        const ratio = contrast(fg, effectiveBg);
        if (ratio < AA_NORMAL) {
          failures.push(`${name}: ${ratio.toFixed(2)}:1`);
        }
      }

      expect(failures).toEqual([]);
    }
  );

  it('the skipped variant specifically clears AA on a FOCUSED card, not just a resting one', () => {
    // The regression this file exists for was only visible in the focused state,
    // which on a D-pad TV surface is where the user spends all of their time.
    const { textColor, fill } = renderedColors('skipped');
    const focusedBg = composite(parseColor(fill), parseColor(colors.surfaceHover));
    const ratio = contrast(parseColor(textColor), focusedBg);
    expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it('does not render badge labels in a raw fill token (the shape of the original defect)', () => {
    // Fill/border tokens are calibrated for 3:1. Using one as a label colour is
    // what produced 2.47:1, so name the specific mistake rather than the symptom.
    const fillOnlyTokens: readonly string[] = [
      colors.skipped,
      colors.narration,
      colors.verified,
      colors.dialogue
    ];
    const offenders: string[] = [];
    for (const variant of ALL_VARIANTS) {
      const { textColor } = renderedColors(variant);
      if (fillOnlyTokens.includes(textColor)) {
        offenders.push(`${variant} -> ${textColor}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
