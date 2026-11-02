import type { Severity } from './types';

// Palette mirrors the website (website/src/global.css) so both feel like one product.
export const colors = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  navy: '#1E293B',
  background: '#F8FAFC',
  section: '#F1F5F9',
  card: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  critical: '#EF4444',
  warning: '#F59E0B',
  watch: '#EAB308',
  info: '#0288D1',
  safe: '#10B981',
  friend: '#7C3AED',
  white: '#FFFFFF',
};

export const severityColor: Record<Severity, string> = {
  Critical: colors.critical,
  Warning: colors.warning,
  Watch: colors.watch,
  Info: colors.info,
};

export const radius = { sm: 6, md: 10, lg: 16, pill: 999 };

export const shadow = {
  shadowColor: '#0F172A',
  shadowOpacity: 0.08,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
};
