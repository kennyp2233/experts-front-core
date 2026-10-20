import { alpha, Components, Theme } from '@mui/material/styles';

// Botones compactos (es una app de trabajo con mucha información por pantalla).
// Jerarquía por variante, no por color:
// - contained: la acción principal de la vista (una sola, en naranja).
// - outlined: acciones secundarias, en gris neutro; con color de estado
//   (error, success, warning…) toma ese color.
// - text: enlaces y acciones terciarias.
const PADDING = { small: [4, 10], medium: [6, 14], large: [9, 20] } as const;
const FONT = { small: '0.8125rem', medium: '0.875rem', large: '0.9375rem' } as const;
const COLORES = ['secondary', 'error', 'warning', 'info', 'success'] as const;

export const createButtonComponents = (mode: 'light' | 'dark'): Components<Theme> => ({
    MuiButton: {
        defaultProps: {
            disableElevation: true,
        },
        styleOverrides: {
            root: ({ ownerState }) => {
                const size = ownerState.size ?? 'medium';
                const [py, px] = PADDING[size];
                const borde = ownerState.variant === 'outlined' ? 1 : 0;
                return {
                    borderRadius: size === 'small' ? 6 : 8,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: FONT[size],
                    lineHeight: 1.6,
                    padding: `${py - borde}px ${px - borde}px`,
                    letterSpacing: 0,
                    whiteSpace: 'nowrap',
                    transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease',
                };
            },
            startIcon: ({ ownerState }) => ({
                marginRight: ownerState.size === 'small' ? 4 : 6,
                '& > *:nth-of-type(1)': { fontSize: ownerState.size === 'small' ? 16 : 18 },
            }),
            endIcon: ({ ownerState }) => ({
                marginLeft: ownerState.size === 'small' ? 2 : 4,
                '& > *:nth-of-type(1)': { fontSize: ownerState.size === 'small' ? 16 : 18 },
            }),
            contained: {
                boxShadow: 'none',
                '&:hover': { boxShadow: 'none' },
            },
            outlined: ({ theme, ownerState }) => {
                const c = ownerState.color;
                if (c && (COLORES as readonly string[]).includes(c)) {
                    const p = theme.palette[c as (typeof COLORES)[number]];
                    return {
                        borderColor: alpha(p.main, 0.5),
                        color: mode === 'light' ? p.dark : p.light,
                        '&:hover': { borderColor: p.main, backgroundColor: alpha(p.main, 0.06) },
                    };
                }
                // primary / inherit: secundaria neutra.
                return {
                    borderColor: mode === 'light' ? '#CBD5E1' : 'rgba(255, 255, 255, 0.2)',
                    color: theme.palette.text.primary,
                    backgroundColor: mode === 'light' ? theme.palette.background.paper : 'transparent',
                    '&:hover': {
                        borderColor: mode === 'light' ? '#94A3B8' : 'rgba(255, 255, 255, 0.35)',
                        backgroundColor: theme.palette.action.hover,
                    },
                    '&.Mui-disabled': {
                        borderColor: theme.palette.divider,
                    },
                };
            },
            text: ({ theme, ownerState }) =>
                ownerState.color === 'primary' || !ownerState.color
                    ? { '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.08) } }
                    : {},
        },
    },
    MuiIconButton: {
        styleOverrides: {
            root: ({ theme }) => ({
                borderRadius: 8,
                transition: 'background-color 0.15s ease, color 0.15s ease',
                '&:hover': {
                    backgroundColor: mode === 'light' ? theme.palette.action.hover : 'rgba(255, 255, 255, 0.08)',
                },
            }),
            sizeSmall: {
                borderRadius: 6,
            },
        },
    },
    // Selector segmentado (períodos, "Hoy / Mañana", vistas): el elegido en tono naranja suave.
    MuiToggleButtonGroup: {
        defaultProps: {
            size: 'small',
        },
        styleOverrides: {
            root: ({ theme }) => ({
                backgroundColor: theme.palette.background.paper,
                borderRadius: 8,
            }),
        },
    },
    MuiToggleButton: {
        styleOverrides: {
            root: ({ theme }) => ({
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.8125rem',
                lineHeight: 1.6,
                padding: '4px 12px',
                color: theme.palette.text.secondary,
                borderColor: mode === 'light' ? '#CBD5E1' : 'rgba(255, 255, 255, 0.2)',
                whiteSpace: 'nowrap',
                '&:hover': { backgroundColor: theme.palette.action.hover },
                '&.Mui-selected': {
                    color: mode === 'light' ? theme.palette.primary.dark : theme.palette.primary.light,
                    backgroundColor: alpha(theme.palette.primary.main, mode === 'light' ? 0.1 : 0.18),
                    fontWeight: 600,
                    '&:hover': { backgroundColor: alpha(theme.palette.primary.main, mode === 'light' ? 0.16 : 0.24) },
                },
            }),
        },
    },
    MuiDialogActions: {
        styleOverrides: {
            root: ({ theme }) => ({
                padding: '12px 24px 20px',
                gap: 8,
                '& > :not(style) ~ :not(style)': { marginLeft: 0 },
                // "Cancelar" en gris: el color queda para la acción del diálogo.
                '& .MuiButton-text.MuiButton-colorPrimary': { color: theme.palette.text.secondary },
            }),
        },
    },
    MuiFab: {
        styleOverrides: {
            root: {
                boxShadow: mode === 'light' ? '0 4px 12px rgba(0, 0, 0, 0.15)' : '0 4px 12px rgba(0, 0, 0, 0.5)',
            },
        },
    },
});
