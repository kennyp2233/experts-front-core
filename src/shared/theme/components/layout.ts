import { Components, Theme } from '@mui/material/styles';

export const createLayoutComponents = (mode: 'light' | 'dark'): Components<Theme> => ({
    MuiPaper: {
        styleOverrides: {
            root: ({ theme }) => ({
                borderRadius: 12,
                backgroundImage: 'none',
                transition: 'box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }),
            elevation1: {
                boxShadow: mode === 'light'
                    ? '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08)'
                    : '0 1px 3px rgba(0, 0, 0, 0.5), 0 1px 2px rgba(0, 0, 0, 0.4)',
            },
            elevation2: {
                boxShadow: mode === 'light'
                    ? '0 3px 6px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.12)'
                    : '0 3px 6px rgba(0, 0, 0, 0.6), 0 2px 4px rgba(0, 0, 0, 0.5)',
            },
            elevation3: {
                boxShadow: mode === 'light'
                    ? '0 10px 20px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.10)'
                    : '0 10px 20px rgba(0, 0, 0, 0.7), 0 3px 6px rgba(0, 0, 0, 0.6)',
            },
        },
    },
    MuiCard: {
        defaultProps: {
            elevation: 0,
        },
        styleOverrides: {
            root: ({ theme }) => ({
                borderRadius: 16,
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: mode === 'light'
                    ? '0 1px 3px rgba(0, 0, 0, 0.08)'
                    : '0 1px 3px rgba(0, 0, 0, 0.4)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                '&:hover': {
                    boxShadow: mode === 'light'
                        ? '0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)'
                        : '0 4px 12px rgba(0, 0, 0, 0.5), 0 2px 6px rgba(0, 0, 0, 0.4)',
                    transform: 'translateY(-2px)',
                },
            }),
        },
    },
    MuiCardHeader: {
        styleOverrides: {
            root: {
                padding: '20px 24px',
            },
            title: {
                fontWeight: 600,
                fontSize: '1.125rem',
            },
            subheader: {
                fontSize: '0.875rem',
                marginTop: 4,
            },
        },
    },
    MuiCardContent: {
        styleOverrides: {
            root: {
                padding: '20px 24px',
                '&:last-child': {
                    paddingBottom: 24,
                },
            },
        },
    },
    MuiCardActions: {
        styleOverrides: {
            root: {
                padding: '16px 24px',
                gap: 12,
            },
        },
    },
    MuiDivider: {
        styleOverrides: {
            root: ({ theme }) => ({
                borderColor: theme.palette.divider,
            }),
        },
    },
    MuiContainer: {
        styleOverrides: {
            root: {
                paddingLeft: 24,
                paddingRight: 24,
            },
        },
    },
});