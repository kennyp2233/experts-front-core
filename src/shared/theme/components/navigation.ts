import { alpha, Components, Theme } from '@mui/material/styles';

export const createNavigationComponents = (mode: 'light' | 'dark'): Components<Theme> => ({
  MuiMenu: {
    styleOverrides: {
      paper: ({ theme }) => ({
        borderRadius: 10,
        marginTop: 4,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: mode === 'light' ? '0 8px 24px rgba(15, 23, 42, 0.12)' : '0 8px 24px rgba(0, 0, 0, 0.5)',
        backgroundImage: 'none',
      }),
      list: {
        padding: 4,
      },
    },
  },
  MuiMenuItem: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 6,
        margin: '1px 0',
        padding: '7px 12px',
        fontSize: '0.875rem',
        minHeight: 0,
        '&:hover': { backgroundColor: theme.palette.action.hover },
        '&.Mui-selected': {
          backgroundColor: alpha(theme.palette.primary.main, mode === 'light' ? 0.1 : 0.16),
          '&:hover': { backgroundColor: alpha(theme.palette.primary.main, mode === 'light' ? 0.14 : 0.2) },
        },
        '& .MuiListItemText-secondary': { fontSize: '0.75rem' },
      }),
    },
  },
  MuiListItemIcon: {
    styleOverrides: {
      root: {
        minWidth: 36,
      },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 8,
        '&:hover': { backgroundColor: theme.palette.action.hover },
        '&.Mui-selected': {
          backgroundColor: alpha(theme.palette.primary.main, mode === 'light' ? 0.1 : 0.16),
          '&:hover': { backgroundColor: alpha(theme.palette.primary.main, mode === 'light' ? 0.14 : 0.2) },
        },
      }),
    },
  },
  // Sin borde propio: la pantalla pone un solo divisor (borderBottom) donde corresponde.
  MuiTabs: {
    styleOverrides: {
      root: {
        minHeight: 42,
      },
      indicator: ({ theme }) => ({
        height: 2,
        borderRadius: '2px 2px 0 0',
        backgroundColor: theme.palette.primary.main,
      }),
      scrollButtons: {
        '&.Mui-disabled': { opacity: 0.3 },
      },
    },
  },
  MuiTab: {
    styleOverrides: {
      root: ({ theme }) => ({
        minHeight: 42,
        minWidth: 0,
        textTransform: 'none',
        fontWeight: 500,
        fontSize: '0.875rem',
        padding: '10px 14px',
        color: theme.palette.text.secondary,
        '&:hover': { color: theme.palette.text.primary },
        '&.Mui-selected': {
          color: mode === 'light' ? theme.palette.primary.dark : theme.palette.primary.light,
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
        marginLeft: 6,
        marginRight: 6,
      }),
    },
  },
});
