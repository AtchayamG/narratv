export const colors = {
  // Background & Surface
  background: '#0B0E14',
  surface: '#151A23',
  surfaceHover: '#1E2634',
  surfaceElevated: '#242E3E',
  overlay: 'rgba(11, 14, 20, 0.85)',

  // Accent & Actions
  primary: '#F59E0B',       // Amber focus / primary CTA
  primaryHover: '#D97706',
  primaryGlow: 'rgba(245, 158, 11, 0.45)',

  // Audio Description (AD) & Subtitle Channels
  narration: '#3B82F6',     // Cobalt Blue (Audio Description blocks & badges)
  narrationLight: '#60A5FA',
  narrationGlow: 'rgba(59, 130, 246, 0.4)',
  
  dialogue: '#10B981',      // Emerald Green (Dialogue / Subtitle cues)
  dialogueLight: '#34D399',
  dialogueGlow: 'rgba(16, 185, 129, 0.4)',

  // Status & Refusal
  skipped: '#64748B',       // Slate Grey (Skipped / Refused blocks)
  verified: '#10B981',      // Emerald (Human verified)
  aiDraft: '#F59E0B',       // Amber (AI Draft)

  // Badge TEXT tints. The tokens above are calibrated as fills and 1px borders,
  // where WCAG 1.4.11 asks for 3:1. Badge labels are 12px text on a 15%-alpha
  // wash of the same token, where 1.4.3 asks for 4.5:1, and the fill tokens do
  // not reach it (skipped 2.47:1, pre-generated 3.08:1 on surfaceElevated).
  // These are the lightened text-only variants; worst case across background,
  // surface, surfaceHover and surfaceElevated is noted per line.
  skippedText: '#A9B4C4',       // 5.60:1 worst case (was #64748B at 2.47:1)
  narrationText: '#93C5FD',     // 6.29:1 worst case (was #3B82F6 at 3.08:1)
  verifiedText: '#34D399',      // 5.58:1 worst case (was #10B981 at 4.23:1)
  error: '#EF4444',         // Red (Errors / 503)
  live: '#EF4444',          // Live pulsing red badge

  // Text Hierarchy
  textPrimary: '#F8FAFC',   // Crisp Bone White (High Contrast)
  textSecondary: '#94A3B8', // Slate Grey
  textMuted: '#64748B',
  textInverse: '#0B0E14',

  // Borders & Dividers
  border: '#242E3E',
  borderFocus: '#F59E0B'
} as const;

export type ColorTheme = typeof colors;
