import { createTheme } from '@mui/material/styles';
import { createPalette } from './palette';
import { typography } from './typography/index';
import { shape } from './shape';
import { createComponents } from './components/index';

export const createAppTheme = (mode: 'light' | 'dark') => {
  return createTheme({
    palette: createPalette(mode),
    typography,
    shape,
    components: createComponents(mode),
  });
};