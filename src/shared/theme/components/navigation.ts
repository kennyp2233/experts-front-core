import { Components, Theme } from '@mui/material/styles';

export const createNavigationComponents = (mode: 'light' | 'dark'): Components<Theme> => ({
  MuiMenu: {
    styleOverrides: {
      paper: ({ theme }) => ({
        borderRadius: 12,
        marginTop: 8,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: mode === 'light'
          ? '0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)'
          : '0 4px 12px rgba(0, 0, 0, 0.5), 0 2px 6px rgba(0, 0, 0, 0.4)',
        backgroundImage: 'none',
      }),
      list: {
        padding: '8px',
      },
    },
  },
  MuiMenuItem: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 8,
        margin: '2px 0',
        padding: '10px 16px',
        fontSize: '0.9375rem',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          backgroundColor: mode === 'light'
            ? 'rgba(255, 107, 53, 0.08)'
            : 'rgba(255, 138, 91, 0.12)',
        },
        '&.Mui-selected': {
          backgroundColor: mode === 'light'
            ? 'rgba(255, 107, 53, 0.12)'
            : 'rgba(255, 138, 91, 0.16)',
          '&:hover': {
            backgroundColor: mode === 'light'
              ? 'rgba(255, 107, 53, 0.16)'
              : 'rgba(255, 138, 91, 0.20)',
          },
        },
      }),
    },
  },
  MuiListItemIcon: {
    styleOverrides: {
      root: {
        minWidth: 40,
      },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 10,
        marginBottom: 4,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          backgroundColor: mode === 'light'
            ? 'rgba(255, 107, 53, 0.08)'
            : 'rgba(255, 138, 91, 0.12)',
        },
        '&.Mui-selected': {
          backgroundColor: mode === 'light'
            ? 'rgba(255, 107, 53, 0.12)'
            : 'rgba(255, 138, 91, 0.16)',
          '&:hover': {
            backgroundColor: mode === 'light'
              ? 'rgba(255, 107, 53, 0.16)'
              : 'rgba(255, 138, 91, 0.20)',
          },
        },
      }),
    },
  },
  MuiTabs: {
    styleOverrides: {
      root: ({ theme }) => ({
        minHeight: 48,
        borderBottom: `2px solid ${theme.palette.divider}`,
      }),
      indicator: ({ theme }) => ({
        height: 3,
        borderRadius: '3px 3px 0 0',
        backgroundColor: theme.palette.primary.main,
      }),
    },
  },
  MuiTab: {
    styleOverrides: {
      root: ({ theme }) => ({
        minHeight: 48,
        textTransform: 'none',
        fontWeight: 500,
        fontSize: '0.9375rem',
        padding: '12px 20px',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          color: theme.palette.primary.main,
          backgroundColor: mode === 'light'
            ? 'rgba(255, 107, 53, 0.04)'
            : 'rgba(255, 138, 91, 0.08)',
        },
        '&.Mui-selected': {
          color: theme.palette.primary.main,
          fontWeight: 600,
        },
      }),
    },
  },
  MuiBreadcrumbs: {
    styleOverrides: {
      root: {
        fontSize: '0.875rem',
      },
      separator: ({ theme }) => ({
        color: theme.palette.text.secondary,
        marginLeft: 8,
        marginRight: 8,
      }),
    },
  },
});