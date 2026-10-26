export type AppTheme = 'dark' | 'light';

export const ANALYTIC_COLORS = {
  dark: {
    bgMain: '#111827',
    bgSurface: '#1F2937',
    bgElevated: '#243042',
    borderSubtle: '#374151',
    borderStrong: '#4B5563',
    textPrimary: '#F9FAFB',
    textSecondary: '#9CA3AF',
    textMuted: '#6B7280',
    accentTeal: '#14B8A6',
    accentBlue: '#3B82F6',
    accentAmber: '#F59E0B',
    accentRed: '#EF4444',
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
    accentTeal: '#0D9488',
    accentBlue: '#2563EB',
    accentAmber: '#D97706',
    accentRed: '#DC2626',
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
    return { label: 'SIN DATO', variant: 'neutral', colorHex: '#6B7280' };
  }
  if (pct >= THRESHOLDS.EXCELLENT) {
    return { label: 'SUPERÁVIT', variant: 'success', colorHex: '#14B8A6' };
  }
  if (pct >= THRESHOLDS.TARGET) {
    return { label: 'META ALCANZADA', variant: 'success', colorHex: '#14B8A6' };
  }
  if (pct >= THRESHOLDS.ACCEPTABLE) {
    return { label: 'EN RANGO', variant: 'acceptable', colorHex: '#3B82F6' };
  }
  if (pct >= THRESHOLDS.CRITICAL) {
    return { label: 'ALERTA BRECHA', variant: 'warning', colorHex: '#F59E0B' };
  }
  return { label: 'DESVÍO CRÍTICO', variant: 'critical', colorHex: '#EF4444' };
}
