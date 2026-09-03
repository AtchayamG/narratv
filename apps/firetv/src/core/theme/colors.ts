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
