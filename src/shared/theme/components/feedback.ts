import { Components, Theme } from '@mui/material/styles';

// Alertas en tono suave: fondo tenue + texto oscuro del mismo color.
// Los fondos saturados competían con el contenido y cansaban la vista.
const ALERT_TONES = {
  light: {
    success: { bg: '#ECFDF5', fg: '#065F46', border: '#A7F3D0', icon: '#059669' },
    error: { bg: '#FEF2F2', fg: '#991B1B', border: '#FECACA', icon: '#DC2626' },
    warning: { bg: '#FFFBEB', fg: '#92400E', border: '#FDE68A', icon: '#D97706' },
    info: { bg: '#F1F5F9', fg: '#334155', border: '#E2E8F0', icon: '#64748B' },
  },
  dark: {
    success: { bg: 'rgba(16, 185, 129, 0.12)', fg: '#A7F3D0', border: 'rgba(16, 185, 129, 0.3)', icon: '#34D399' },
    error: { bg: 'rgba(239, 68, 68, 0.12)', fg: '#FECACA', border: 'rgba(239, 68, 68, 0.3)', icon: '#F87171' },
    warning: { bg: 'rgba(245, 158, 11, 0.12)', fg: '#FDE68A', border: 'rgba(245, 158, 11, 0.3)', icon: '#FBBF24' },
    info: { bg: 'rgba(148, 163, 184, 0.12)', fg: '#CBD5E1', border: 'rgba(148, 163, 184, 0.25)', icon: '#94A3B8' },
  },
} as const;

const alertTone = (mode: 'light' | 'dark', severity: keyof typeof ALERT_TONES.light) => {
  const t = ALERT_TONES[mode][severity];
  return {
    backgroundColor: t.bg,
    color: t.fg,
    borderColor: t.border,
    '& .MuiAlert-icon': { color: t.icon },
    '& .MuiAlert-action .MuiIconButton-root': { color: t.fg },
  };
};

export const createFeedbackComponents = (mode: 'light' | 'dark'): Components<Theme> => ({
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: 10,
        padding: '8px 14px',
        fontSize: '0.875rem',
        border: '1px solid',
        alignItems: 'center',
      },
      standardSuccess: alertTone(mode, 'success'),
      standardError: alertTone(mode, 'error'),
      standardWarning: alertTone(mode, 'warning'),
      standardInfo: alertTone(mode, 'info'),
    },
  },
  MuiSnackbar: {
    styleOverrides: {
      root: {
        '& .MuiPaper-root': {
          borderRadius: 12,
          boxShadow: mode === 'light'
            ? '0 4px 12px rgba(0, 0, 0, 0.15)'
            : '0 4px 12px rgba(0, 0, 0, 0.5)',
        },
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: ({ theme }) => ({
        borderRadius: 16,
        boxShadow: mode === 'light'
          ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          : '0 20px 25px -5px rgba(0, 0, 0, 0.7), 0 10px 10px -5px rgba(0, 0, 0, 0.5)',
        backgroundImage: 'none',
      }),
    },
  },
  MuiDialogTitle: {
    styleOverrides: {
      root: ({ theme }) => ({
        fontSize: '1.25rem',
        fontWeight: 600,
        padding: '24px 24px 16px',
        color: theme.palette.text.primary,
      }),
    },
  },
  MuiDialogContent: {
    styleOverrides: {
      root: {
        padding: '20px 24px',
        fontSize: '0.9375rem',
      },
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: ({ theme }) => ({
        backgroundColor: mode === 'light'
          ? 'rgba(30, 41, 59, 0.95)'
          : 'rgba(241, 245, 249, 0.95)',
        color: mode === 'light' ? '#F1F5F9' : '#1E293B',
        fontSize: '0.8125rem',
        fontWeight: 500,
        borderRadius: 8,
        padding: '8px 12px',
        boxShadow: mode === 'light'
          ? '0 4px 6px rgba(0, 0, 0, 0.1)'
          : '0 4px 6px rgba(0, 0, 0, 0.4)',
      }),
      arrow: ({ theme }) => ({
        color: mode === 'light'
          ? 'rgba(30, 41, 59, 0.95)'
          : 'rgba(241, 245, 249, 0.95)',
      }),
    },
  },
  MuiBackdrop: {
    styleOverrides: {
      root: {
        backdropFilter: 'blur(4px)',
        backgroundColor: mode === 'light'
          ? 'rgba(0, 0, 0, 0.5)'
          : 'rgba(0, 0, 0, 0.7)',
      },
    },
  },
  MuiCircularProgress: {
    styleOverrides: {
      root: {
        animationDuration: '1.4s',
      },
    },
  },
  MuiLinearProgress: {
    styleOverrides: {
      root: {
        borderRadius: 4,
        height: 6,
      },
      bar: {
        borderRadius: 4,
      },
    },
  },
  MuiSkeleton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        backgroundColor: mode === 'light'
          ? 'rgba(0, 0, 0, 0.11)'
          : 'rgba(255, 255, 255, 0.11)',
      },
    },
  },
});