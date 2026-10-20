import { alpha, Components, Theme } from '@mui/material/styles';

// Superficies planas con borde fino. Nada se mueve al pasar el mouse: solo
// las tarjetas que son enlaces (CardActionArea) marcan el borde.
export const createLayoutComponents = (mode: 'light' | 'dark'): Components<Theme> => ({
    MuiPaper: {
        styleOverrides: {
            root: {
                borderRadius: 10,
                backgroundImage: 'none',
            },
            outlined: ({ theme }) => ({
                borderColor: theme.palette.divider,
            }),
            elevation1: {
                boxShadow: mode === 'light'
                    ? '0 1px 2px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.08)'
                    : '0 1px 3px rgba(0, 0, 0, 0.5)',
            },
            elevation2: {
                boxShadow: mode === 'light'
                    ? '0 2px 6px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.06)'
                    : '0 3px 6px rgba(0, 0, 0, 0.6)',
            },
            elevation3: {
                boxShadow: mode === 'light'
                    ? '0 8px 24px rgba(15, 23, 42, 0.12)'
                    : '0 8px 24px rgba(0, 0, 0, 0.6)',
            },
        },
    },
    // Barras y menú lateral pegados a los bordes de la ventana: sin redondeo.
    MuiAppBar: {
        defaultProps: {
            elevation: 0,
        },
        styleOverrides: {
            root: {
                borderRadius: 0,
            },
        },
    },
    MuiDrawer: {
        styleOverrides: {
            paper: {
                borderRadius: 0,
            },
        },
    },
    MuiCard: {
        defaultProps: {
            elevation: 0,
            variant: 'outlined',
        },
        styleOverrides: {
            root: ({ theme }) => ({
                borderRadius: 12,
                borderColor: theme.palette.divider,
                overflow: 'hidden',
                '&:has(> .MuiCardActionArea-root)': {
                    transition: 'border-color 0.15s ease',
                    '&:hover': { borderColor: alpha(theme.palette.primary.main, 0.5) },
                },
            }),
        },
    },
    MuiCardActionArea: {
        styleOverrides: {
            focusHighlight: {
                backgroundColor: 'transparent',
            },
        },
    },
    MuiCardHeader: {
        styleOverrides: {
            root: {
                padding: '16px 20px',
            },
            title: {
                fontWeight: 600,
                fontSize: '1rem',
            },
            subheader: {
                fontSize: '0.8125rem',
                marginTop: 2,
            },
        },
    },
    MuiCardContent: {
        styleOverrides: {
            root: {
                padding: '16px 20px',
                '&:last-child': {
                    paddingBottom: 20,
                },
            },
        },
    },
    MuiCardActions: {
        styleOverrides: {
            root: {
                padding: '12px 20px',
                gap: 8,
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
    MuiLink: {
        defaultProps: {
            underline: 'hover',
        },
        styleOverrides: {
            root: {
                fontWeight: 500,
            },
        },
    },
});
