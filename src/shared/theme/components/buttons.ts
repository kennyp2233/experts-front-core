import { Components, Theme } from '@mui/material/styles';

export const createButtonComponents = (mode: 'light' | 'dark'): Components<Theme> => ({
    MuiButton: {
        defaultProps: {
            disableElevation: true,
        },
        styleOverrides: {
            root: ({ theme }) => ({
                borderRadius: 10,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.9375rem',
                padding: '10px 20px',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                letterSpacing: '0.01em',
                '&:active': {
                    transform: 'scale(0.98)',
                },
            }),
            sizeSmall: {
                padding: '6px 16px',
                fontSize: '0.8125rem',
                borderRadius: 8,
            },
            sizeLarge: {
                padding: '12px 28px',
                fontSize: '1rem',
                borderRadius: 12,
            },
            contained: ({ theme }) => ({
                boxShadow: mode === 'light' 
                    ? '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08)'
                    : '0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3)',
                '&:hover': {
                    boxShadow: mode === 'light'
                        ? '0 4px 6px rgba(0, 0, 0, 0.16), 0 2px 4px rgba(0, 0, 0, 0.08)'
                        : '0 4px 6px rgba(0, 0, 0, 0.5), 0 2px 4px rgba(0, 0, 0, 0.3)',
                    transform: 'translateY(-1px)',
                },
            }),
            outlined: ({ theme }) => ({
                borderWidth: 2,
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                '&:hover': {
                    borderWidth: 2,
                    borderColor: theme.palette.primary.dark,
                    backgroundColor: mode === 'light'
                        ? 'rgba(255, 107, 53, 0.08)'
                        : 'rgba(255, 138, 91, 0.12)',
                },
            }),
            text: ({ theme }) => ({
                '&:hover': {
                    backgroundColor: mode === 'light'
                        ? 'rgba(255, 107, 53, 0.08)'
                        : 'rgba(255, 138, 91, 0.12)',
                },
            }),
        },
    },
    MuiIconButton: {
        styleOverrides: {
            root: ({ theme }) => ({
                borderRadius: 10,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                    backgroundColor: mode === 'light'
                        ? theme.palette.action.hover
                        : 'rgba(255, 255, 255, 0.08)',
                    transform: 'scale(1.05)',
                },
                '&:active': {
                    transform: 'scale(0.95)',
                },
            }),
            sizeSmall: {
                borderRadius: 8,
            },
            sizeLarge: {
                borderRadius: 12,
            },
        },
    },
    MuiDialogActions: {
        styleOverrides: {
            root: {
                padding: '20px 24px',
                gap: 12,
                '& .MuiButton-root': {
                    minWidth: 100,
                },
            },
        },
    },
    MuiFab: {
        styleOverrides: {
            root: ({ theme }) => ({
                boxShadow: mode === 'light'
                    ? '0 4px 12px rgba(0, 0, 0, 0.15)'
                    : '0 4px 12px rgba(0, 0, 0, 0.5)',
                '&:hover': {
                    boxShadow: mode === 'light'
                        ? '0 6px 16px rgba(0, 0, 0, 0.2)'
                        : '0 6px 16px rgba(0, 0, 0, 0.6)',
                    transform: 'translateY(-2px)',
                },
                '&:active': {
                    transform: 'scale(0.96)',
                },
            }),
        },
    },
});