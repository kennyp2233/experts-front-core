import { Components, Theme } from '@mui/material/styles';

export const createGlobalComponents = (mode: 'light' | 'dark'): Components<Theme> => ({
    MuiCssBaseline: {
        styleOverrides: (theme: Theme) => ({
            '@import': "url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap')",
            html: {
                fontFamily: '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", sans-serif !important',
            },
            '*': {
                fontFamily: '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", sans-serif !important',
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