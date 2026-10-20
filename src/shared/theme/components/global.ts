import { Components, Theme } from '@mui/material/styles';
import { FUENTE } from '../typography';

export const createGlobalComponents = (mode: 'light' | 'dark'): Components<Theme> => ({
    MuiCssBaseline: {
        styleOverrides: (theme: Theme) => ({
            // Misma fuente en todo, también en las hojas de impresión (calibradas con ella).
            html: {
                fontFamily: `${FUENTE} !important`,
            },
            '*': {
                fontFamily: `${FUENTE} !important`,
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
            },
            'code, pre, kbd, samp': {
                fontFamily: '"JetBrains Mono", "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace !important',
            },
            // Custom scrollbars
            '::-webkit-scrollbar': {
                width: '12px',
                height: '12px',
            },
            '::-webkit-scrollbar-track': {
                background: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100],
                borderRadius: '6px',
            },
            '::-webkit-scrollbar-thumb': {
                background: theme.palette.mode === 'dark' ? theme.palette.grey[600] : theme.palette.grey[400],
                borderRadius: '6px',
                border: `2px solid ${theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100]}`,
            },
            '::-webkit-scrollbar-thumb:hover': {
                background: theme.palette.mode === 'dark' ? theme.palette.grey[500] : theme.palette.grey[500],
            },
            '::-webkit-scrollbar-corner': {
                background: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100],
            },
        }),
    },
});