"use client";

import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useTheme } from './theme-context';
import { createAppTheme } from '../theme';

export default function ThemeProviderWrapper({ children }: { children: React.ReactNode }) {
  const { actualMode } = useTheme();

  const theme = createAppTheme(actualMode);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      {children}
    </MuiThemeProvider>
  );
}