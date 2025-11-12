import { Components, Theme } from '@mui/material/styles';

export const createFeedbackComponents = (mode: 'light' | 'dark'): Components<Theme> => ({
  MuiAlert: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 12,
        padding: '12px 16px',
        fontSize: '0.9375rem',
        border: `1px solid`,
        alignItems: 'center',
      }),
      standardSuccess: ({ theme }) => ({
        backgroundColor: mode === 'light' 
          ? 'rgba(16, 185, 129, 0.1)' 
          : 'rgba(52, 211, 153, 0.15)',
        color: theme.palette.success.dark,
        borderColor: theme.palette.success.main,
        '& .MuiAlert-icon': {
          color: theme.palette.success.main,
        },
      }),
      standardError: ({ theme }) => ({
        backgroundColor: mode === 'light' 
          ? 'rgba(239, 68, 68, 0.1)' 
          : 'rgba(248, 113, 113, 0.15)',
        color: theme.palette.error.dark,
        borderColor: theme.palette.error.main,
        '& .MuiAlert-icon': {
          color: theme.palette.error.main,
        },
      }),
      standardWarning: ({ theme }) => ({
        backgroundColor: mode === 'light' 
          ? 'rgba(245, 158, 11, 0.1)' 
          : 'rgba(251, 191, 36, 0.15)',
        color: theme.palette.warning.dark,
        borderColor: theme.palette.warning.main,
        '& .MuiAlert-icon': {
          color: theme.palette.warning.main,
        },
      }),
      standardInfo: ({ theme }) => ({
        backgroundColor: mode === 'light' 
          ? 'rgba(59, 130, 246, 0.1)' 
          : 'rgba(96, 165, 250, 0.15)',
        color: theme.palette.info.dark,
        borderColor: theme.palette.info.main,
        '& .MuiAlert-icon': {
          color: theme.palette.info.main,
        },
      }),
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