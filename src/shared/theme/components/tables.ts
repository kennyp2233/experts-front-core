import { alpha, Components, Theme } from '@mui/material/styles';

const TONOS = ['primary', 'secondary', 'success', 'error', 'warning', 'info'] as const;

// Tablas: cabecera neutra (el color de marca queda para acciones y selección),
// celdas compactas y contenedor con scroll para que ninguna columna quede
// inalcanzable.
export const createTableComponents = (mode: 'light' | 'dark'): Components<Theme> => ({
    MuiTable: {
        styleOverrides: {
            root: {
                borderCollapse: 'separate',
                borderSpacing: 0,
            },
        },
    },
    MuiTableHead: {
        styleOverrides: {
            root: ({ theme }) => ({
                '& .MuiTableCell-head': {
                    backgroundColor: mode === 'light' ? '#F8FAFC' : '#172033',
                    color: theme.palette.text.secondary,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    padding: '8px 12px',
                    whiteSpace: 'nowrap',
                    '&:first-of-type': {
                        paddingLeft: 16,
                    },
                    '&:last-of-type': {
                        paddingRight: 16,
                    },
                },
            }),
        },
    },
    MuiTableBody: {
        styleOverrides: {
            root: ({ theme }) => ({
                '& .MuiTableCell-body': {
                    padding: '8px 12px',
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    fontSize: '0.875rem',
                    color: theme.palette.text.primary,
                    '&:first-of-type': {
                        paddingLeft: 16,
                    },
                    '&:last-of-type': {
                        paddingRight: 16,
                    },
                },
                // Los botones de ícono de una fila no la hacen más alta que las demás.
                '& .MuiTableCell-body .MuiIconButton-sizeSmall': {
                    margin: '-4px 0',
                },
                '& .MuiTableRow-root': {
                    transition: 'background-color 0.15s ease',
                    '&:hover': {
                        backgroundColor: mode === 'light'
                            ? 'rgba(15, 23, 42, 0.03)'
                            : 'rgba(255, 255, 255, 0.04)',
                    },
                    '&:last-of-type .MuiTableCell-body': {
                        borderBottom: 'none',
                    },
                    '&.Mui-selected': {
                        backgroundColor: alpha(theme.palette.primary.main, mode === 'light' ? 0.08 : 0.12),
                        '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, mode === 'light' ? 0.12 : 0.16),
                        },
                    },
                },
            }),
        },
    },
    MuiTableCell: {
        styleOverrides: {
            root: {
                borderBottom: 'none',
            },
        },
    },
    MuiTableContainer: {
        styleOverrides: {
            root: ({ theme }) => ({
                borderRadius: 10,
                border: `1px solid ${theme.palette.divider}`,
                overflow: 'auto',
                backgroundColor: theme.palette.background.paper,
                boxShadow: 'none',
            }),
        },
    },
    MuiTablePagination: {
        styleOverrides: {
            root: ({ theme }) => ({
                borderTop: `1px solid ${theme.palette.divider}`,
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                    fontSize: '0.875rem',
                    color: theme.palette.text.secondary,
                    margin: 0,
                },
            }),
        },
    },
    // Chips de estado en un solo estilo tonal: fondo suave y texto del color.
    // Sólidos saturados y bordes de colores mezclados competían con los datos.
    MuiChip: {
        styleOverrides: {
            root: ({ theme, ownerState }) => {
                const c = ownerState.color;
                const tono = c && (TONOS as readonly string[]).includes(c) ? theme.palette[c as (typeof TONOS)[number]] : null;
                return {
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    height: ownerState.size === 'small' ? 22 : 26,
                    borderRadius: 6,
                    ...(tono && {
                        backgroundColor: alpha(tono.main, mode === 'light' ? 0.12 : 0.2),
                        color: mode === 'light' ? tono.dark : tono.light,
                        border: '1px solid transparent',
                        '& .MuiChip-icon': { color: 'inherit' },
                        '&.MuiChip-clickable:hover': { backgroundColor: alpha(tono.main, mode === 'light' ? 0.2 : 0.28) },
                    }),
                    ...(!tono && ownerState.variant === 'outlined' && {
                        borderColor: mode === 'light' ? '#CBD5E1' : 'rgba(255, 255, 255, 0.2)',
                        color: theme.palette.text.secondary,
                    }),
                };
            },
            label: ({ ownerState }) => ({
                paddingLeft: ownerState.size === 'small' ? 7 : 10,
                paddingRight: ownerState.size === 'small' ? 7 : 10,
            }),
            icon: {
                marginLeft: 6,
                marginRight: -2,
                fontSize: 15,
            },
            deleteIcon: {
                fontSize: '1rem',
            },
        },
    },
});
