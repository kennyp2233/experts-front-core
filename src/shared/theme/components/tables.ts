import { Components, Theme } from '@mui/material/styles';

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
                    padding: '10px 12px',
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
                    padding: '10px 12px',
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
                        backgroundColor: mode === 'light'
                            ? 'rgba(255, 107, 53, 0.08)'
                            : 'rgba(255, 138, 91, 0.12)',
                        '&:hover': {
                            backgroundColor: mode === 'light'
                                ? 'rgba(255, 107, 53, 0.12)'
                                : 'rgba(255, 138, 91, 0.16)',
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
                borderRadius: 12,
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
                backgroundColor: mode === 'light' 
                    ? 'rgba(255, 107, 53, 0.02)' 
                    : 'rgba(255, 138, 91, 0.04)',
                '& .MuiTablePagination-toolbar': {
                    padding: '12px 24px',
                    minHeight: 64,
                },
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                    fontSize: '0.875rem',
                    color: theme.palette.text.secondary,
                    margin: 0,
                },
                '& .MuiTablePagination-select': {
                    borderRadius: 8,
                    paddingTop: 8,
                    paddingBottom: 8,
                },
                '& .MuiIconButton-root': {
                    borderRadius: 8,
                    '&:hover': {
                        backgroundColor: mode === 'light'
                            ? 'rgba(255, 107, 53, 0.08)'
                            : 'rgba(255, 138, 91, 0.12)',
                    },
                    '&.Mui-disabled': {
                        opacity: 0.3,
                    },
                },
            }),
        },
    },
    MuiChip: {
        styleOverrides: {
            root: ({ theme }) => ({
                fontWeight: 600,
                fontSize: '0.75rem',
                height: 24,
                borderRadius: 6,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&.MuiChip-filled': {
                    '&.MuiChip-colorSuccess': {
                        backgroundColor: mode === 'light' 
                            ? theme.palette.success.main 
                            : theme.palette.success.dark,
                        color: '#fff',
                    },
                    '&.MuiChip-colorError': {
                        backgroundColor: mode === 'light' 
                            ? theme.palette.error.main 
                            : theme.palette.error.dark,
                        color: '#fff',
                    },
                    '&.MuiChip-colorWarning': {
                        backgroundColor: mode === 'light' 
                            ? theme.palette.warning.main 
                            : theme.palette.warning.dark,
                        color: '#000',
                    },
                    '&.MuiChip-colorInfo': {
                        backgroundColor: mode === 'light' 
                            ? theme.palette.info.main 
                            : theme.palette.info.dark,
                        color: '#fff',
                    },
                },
                '&.MuiChip-outlined': {
                    borderWidth: 1,
                },
            }),
            deleteIcon: {
                fontSize: '1rem',
                '&:hover': {
                    opacity: 0.7,
                },
            },
        },
    },
});