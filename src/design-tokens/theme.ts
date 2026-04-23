/**
 * SYNRGY brand design tokens.
 *
 * The canonical source of truth is the @theme block in index.css.
 * This file mirrors those values for any TypeScript consumers that
 * need token values at runtime (e.g. PDF generation, canvas drawing).
 */
export const tokens = {
  colors: {
    base: '#F5EDE1',
    accent: '#005F78',
    accentGlow: 'rgba(0, 95, 120, 0.08)',
    accentMuted: 'rgba(0, 95, 120, 0.6)',
    accentBorder: 'rgba(0, 95, 120, 0.3)',
    secondary: '#C95A38',
    secondaryGlow: 'rgba(201, 90, 56, 0.1)',
    textPrimary: '#1A3A42',
    textSecondary: '#5A6E73',
    textTertiary: 'rgba(90, 110, 115, 0.65)',
    surfaceGlass: '#FFFFFF',
    surfaceGlassLight: '#FAF5EC',
    surfaceGlassHover: '#F0E8DB',
    surfaceGlassActive: '#E8F1F4',
    borderGlass: '#D9CFC0',
    borderGlassLight: '#D9CFC0',
    borderGlassHover: 'rgba(0, 95, 120, 0.3)',
    success: '#059669',
    successGlow: 'rgba(5, 150, 105, 0.08)',
    warning: '#D97706',
    warningGlow: 'rgba(217, 119, 6, 0.08)',
    error: '#DC2626',
    errorGlow: 'rgba(220, 38, 38, 0.08)',
    synrgyTeal: '#005F78',
    synrgyTealDeep: '#004558',
    synrgyTealSoft: '#E8F1F4',
    synrgyOrange: '#C95A38',
    synrgyOrangeHover: '#B14D2E',
    synrgyCream: '#F5EDE1',
    synrgyCreamSoft: '#FAF5EC',
    synrgyInk: '#1A3A42',
    synrgyMuted: '#5A6E73',
    synrgyBorder: '#D9CFC0',
  },
  fonts: {
    body: '"Geist", "Calibri Light", system-ui, sans-serif',
    mono: '"DM Mono", ui-monospace, monospace',
  },
  radii: {
    input: '12px',
    card: '22px',
    cardSm: '16px',
    pill: '9999px',
    button: '14px',
    segment: '10px',
  },
  spacing: {
    sectionPadding: '24px',
    inputGroupGap: '16px',
    cardGridGap: '12px',
    labelToInput: '4px',
  },
} as const;
