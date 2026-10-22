export type AppTheme = 'dark' | 'light';

export const ANALYTIC_COLORS = {
  dark: {
    bgMain: '#0B0D10',
    bgSurface: '#12161C',
    bgElevated: '#191F27',
    borderSubtle: '#242C37',
    borderStrong: '#333D4D',
    textPrimary: '#F1F5F9',
    textSecondary: '#929EAD',
    textMuted: '#626D7C',
    accentLime: '#C5F467',
    accentBlue: '#38BDF8',
    accentAmber: '#F59E0B',
    accentCoral: '#FB7185',
  },
  light: {
    bgMain: '#F8FAFC',
    bgSurface: '#FFFFFF',
    bgElevated: '#F1F5F9',
    borderSubtle: '#E2E8F0',
    borderStrong: '#CBD5E1',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    accentLime: '#4D7C0F',
    accentBlue: '#0284C7',
    accentAmber: '#D97706',
    accentCoral: '#E11D48',
  }
};

export const THRESHOLDS = {
  EXCELLENT: 105,
  TARGET: 100,
  ACCEPTABLE: 90,
  CRITICAL: 80
};

export function getComplianceStatus(pct: number | null): {
  label: string;
  variant: 'success' | 'acceptable' | 'warning' | 'critical' | 'neutral';
  colorHex: string;
} {
  if (pct === null || isNaN(pct)) {
    return { label: 'SIN DATO', variant: 'neutral', colorHex: '#626D7C' };
  }
  if (pct >= THRESHOLDS.EXCELLENT) {
    return { label: 'SUPERÁVIT', variant: 'success', colorHex: '#C5F467' };
  }
  if (pct >= THRESHOLDS.TARGET) {
    return { label: 'META ALCANZADA', variant: 'success', colorHex: '#C5F467' };
  }
  if (pct >= THRESHOLDS.ACCEPTABLE) {
    return { label: 'EN RANGO', variant: 'acceptable', colorHex: '#38BDF8' };
  }
  if (pct >= THRESHOLDS.CRITICAL) {
    return { label: 'ALERTA BRECHA', variant: 'warning', colorHex: '#F59E0B' };
  }
  return { label: 'DESVÍO CRÍTICO', variant: 'critical', colorHex: '#FB7185' };
}
