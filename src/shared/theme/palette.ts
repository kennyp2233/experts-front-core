import { PaletteMode, PaletteOptions } from '@mui/material';

export const createPalette = (mode: PaletteMode): PaletteOptions => ({
  mode,
  primary: {
    main: mode === 'light' ? '#FF6B35' : '#FF8A5B',
    light: mode === 'light' ? '#FF8A5B' : '#FFAD85',
    dark: mode === 'light' ? '#E55A2B' : '#E55A2B',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: mode === 'light' ? '#FDB462' : '#FDCB82',
    light: mode === 'light' ? '#FDCB82' : '#FDE2B3',
    dark: mode === 'light' ? '#E5A258' : '#E5A258',
    contrastText: '#000000',
  },
  success: {
    main: mode === 'light' ? '#10B981' : '#34D399',
    light: mode === 'light' ? '#34D399' : '#6EE7B7',
    dark: mode === 'light' ? '#059669' : '#059669',
    contrastText: '#FFFFFF',
  },
  error: {
    main: mode === 'light' ? '#EF4444' : '#F87171',
    light: mode === 'light' ? '#F87171' : '#FCA5A5',
    dark: mode === 'light' ? '#DC2626' : '#DC2626',
    contrastText: '#FFFFFF',
  },
  warning: {
    main: mode === 'light' ? '#F59E0B' : '#FBBF24',
    light: mode === 'light' ? '#FBBF24' : '#FCD34D',
    dark: mode === 'light' ? '#D97706' : '#D97706',
    contrastText: '#000000',
  },
  info: {
    main: mode === 'light' ? '#3B82F6' : '#60A5FA',
    light: mode === 'light' ? '#60A5FA' : '#93C5FD',
    dark: mode === 'light' ? '#2563EB' : '#2563EB',
    contrastText: '#FFFFFF',
  },
  background: {
    default: mode === 'light' ? '#F8FAFC' : '#0F172A',
    paper: mode === 'light' ? '#FFFFFF' : '#1E293B',
  },
  text: {
    primary: mode === 'light' ? '#1E293B' : '#F1F5F9',
    secondary: mode === 'light' ? '#64748B' : '#94A3B8',
    disabled: mode === 'light' ? '#CBD5E1' : '#475569',
  },
  divider: mode === 'light' ? '#E2E8F0' : '#334155',
  action: {
    active: mode === 'light' ? '#64748B' : '#94A3B8',
    hover: mode === 'light' ? '#F1F5F9' : '#334155',
    selected: mode === 'light' ? '#E0E7FF' : '#3730A3',
    disabled: mode === 'light' ? '#CBD5E1' : '#475569',
    disabledBackground: mode === 'light' ? '#F1F5F9' : '#1E293B',
  },
});