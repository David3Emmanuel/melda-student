// Design tokens for the whole app. One place to change the look.
//
// Colour decisions follow the dataviz method: the struggle chart is a single
// series, so every struggle bar uses ONE constant colour (magnitude is read
// from bar length, not hue) rather than a cycled categorical ramp. Status
// colours are reserved and always ship next to a text label, never colour
// alone. Ink colours clear WCAG AA on white for body text.

export const color = {
  // surfaces
  appBg: '#F4F5F7',
  card: '#FFFFFF',
  cardAlt: '#FBFBFC',
  border: '#E4E7EC',
  track: '#EDEFF3', // empty bar track

  // ink (all AA on white)
  ink: '#17203A',
  inkSecondary: '#48546B',
  inkMuted: '#6B7280',
  inkInverse: '#FFFFFF',

  // brand
  accent: '#4F46E5',
  accentSoft: '#EEF0FE',
  accentInk: '#3730A3',

  // status (paired with labels in the UI)
  struggle: '#DC2626',
  struggleSoft: '#FEE2E2',
  struggleInk: '#B91C1C',
  ok: '#15803D',
  okSoft: '#DCFCE7',
  okInk: '#166534',
  warn: '#B45309',
  warnSoft: '#FEF3C7',
  warnInk: '#92400E',
  neutralSoft: '#EEF1F4',
} as const;

/** 4pt spacing grid. */
export const sp = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, huge: 44 } as const;

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

export const font = {
  display: 32,
  h1: 24,
  h2: 19,
  h3: 16,
  body: 15,
  small: 13,
  tiny: 11,
} as const;

export const weight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export type Tone = 'struggle' | 'warn' | 'ok' | 'accent' | 'neutral';

/** Background/foreground pair for a soft badge or tile of a given tone. */
export const toneStyle = (tone: Tone): { bg: string; fg: string } => {
  switch (tone) {
    case 'struggle':
      return { bg: color.struggleSoft, fg: color.struggleInk };
    case 'warn':
      return { bg: color.warnSoft, fg: color.warnInk };
    case 'ok':
      return { bg: color.okSoft, fg: color.okInk };
    case 'accent':
      return { bg: color.accentSoft, fg: color.accentInk };
    case 'neutral':
      return { bg: color.neutralSoft, fg: color.inkSecondary };
  }
};

/** Map a concept struggle % to a tone + short word for badges. */
export const struggleTone = (pct: number): { tone: Tone; label: string } => {
  if (pct >= 25) return { tone: 'struggle', label: 'High' };
  if (pct >= 12) return { tone: 'warn', label: 'Watch' };
  return { tone: 'ok', label: 'Low' };
};

/** Below 50% mastery is "struggling" - the same threshold the aggregation uses. */
export const masteryTone = (pct: number | null): { tone: Tone; label: string } => {
  if (pct === null) return { tone: 'neutral', label: 'No data' };
  if (pct < 50) return { tone: 'struggle', label: 'Struggling' };
  if (pct < 75) return { tone: 'warn', label: 'Getting there' };
  return { tone: 'ok', label: 'On track' };
};

/** Human-friendly label for a raw signal type. */
export const signalLabel: Record<string, string> = {
  QUESTION_STRUGGLE: 'Got stuck on a question',
  CONCEPT_REVISIT: 'Revisited a concept',
  REQUEST_SIMPLER: 'Asked for a simpler explanation',
  REQUEST_ALTERNATIVE_EXPLANATION: 'Asked for another explanation',
  ACTIVITY_PERFORMANCE: 'Activity result',
  ASSIGNMENT_PERFORMANCE: 'Assignment result',
  INCORRECT_PATTERN: 'Repeated mistake pattern',
  TIME_ON_SECTION: 'Time spent on a section',
  RESOURCE_ENGAGEMENT: 'Opened a resource',
  SUBMISSION_TIMESTAMP: 'Submitted work',
};

/** Short label for each adaptation mode (used on chips and adaptation cards). */
export const adaptationLabel: Record<string, string> = {
  simpler: 'Simpler',
  detailed: 'More detail',
  example: 'Worked example',
  visual: 'Visual',
  practice: 'Practice',
  reexplain: 'Re-explained',
};
