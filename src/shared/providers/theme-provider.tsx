"use client";

import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme } from '@mui/material/styles';
import { orange, amber } from '@mui/material/colors';
import { useTheme } from './theme-context';

export default function ThemeProviderWrapper({ children }: { children: React.ReactNode }) {
  const { actualMode } = useTheme();

  const theme = createTheme({
    palette: {
      mode: actualMode,
      primary: orange,
      secondary: amber,
    },
    typography: {
      fontFamily: '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", sans-serif',
      allVariants: {
        fontFamily: '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", sans-serif',
      },
      h1: {
        fontWeight: 700,
        letterSpacing: '-0.02em',
      },
      h2: {
        fontWeight: 700,
        letterSpacing: '-0.01em',
      },
      h3: {
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
      h4: {
        fontWeight: 600,
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
      body1: {
        fontWeight: 400,
        letterSpacing: '0.01em',
      },
      body2: {
        fontWeight: 400,
        letterSpacing: '0.01em',
      },
      button: {
        fontWeight: 500,
        letterSpacing: '0.02em',
        textTransform: 'none',
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            fontWeight: 500,
            padding: '8px 20px',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 10,
            },
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          root: {
            width: 42,
            height: 26,
            padding: 0,
          },
          switchBase: {
            padding: 0,
            margin: 2,
            transitionDuration: '300ms',
            '&.Mui-checked': {
              transform: 'translateX(16px)',
              color: '#fff',
              '& + .MuiSwitch-track': {
                backgroundColor: '#65C466',
                opacity: 1,
                border: 0,
              },
              '&.Mui-disabled + .MuiSwitch-track': {
                opacity: 0.5,
              },
            },
            '&.Mui-focusVisible .MuiSwitch-thumb': {
              color: '#33cf4d',
              border: '6px solid #fff',
            },
            '&.Mui-disabled .MuiSwitch-thumb': {
              color: actualMode === 'dark' ? '#666666' : '#E9E9EA',
            },
            '&.Mui-disabled + .MuiSwitch-track': {
              opacity: 0.7,
            },
          },
          thumb: {
            boxSizing: 'border-box',
            width: 22,
            height: 22,
            backgroundColor: '#fff',
            boxShadow: '0 2px 4px 0 rgba(0,0,0,0.12), 0 2px 4px 0 rgba(0,0,0,0.08)',
          },
          track: {
            borderRadius: 26 / 2,
            backgroundColor: actualMode === 'dark' ? '#555555' : '#E9E9EA',
            opacity: 1,
            transition: 'background-color 500ms',
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: `
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
          
          html {
            font-family: "Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", sans-serif !important;
          }
          
          * {
            font-family: "Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", sans-serif !important;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          
          code, pre, kbd, samp {
            font-family: "JetBrains Mono", "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace !important;
          }
          
          /* Custom scrollbars */
          ::-webkit-scrollbar {
            width: 12px;
            height: 12px;
          }
          
          ::-webkit-scrollbar-track {
            background: ${actualMode === 'dark' ? '#2d2d2d' : '#f1f1f1'};
            border-radius: 6px;
          }
          
          ::-webkit-scrollbar-thumb {
            background: ${actualMode === 'dark' ? '#555555' : '#c1c1c1'};
            border-radius: 6px;
            border: 2px solid ${actualMode === 'dark' ? '#2d2d2d' : '#f1f1f1'};
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: ${actualMode === 'dark' ? '#777777' : '#a8a8a8'};
          }
          
          ::-webkit-scrollbar-corner {
            background: ${actualMode === 'dark' ? '#2d2d2d' : '#f1f1f1'};
          }
        `,
      },
    },
  });

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      {children}
    </MuiThemeProvider>
  );
}