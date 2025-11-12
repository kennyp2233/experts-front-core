import { Components, Theme } from '@mui/material/styles';
import { createFormFieldComponents } from './form-fields';
import { createLayoutComponents } from './layout';
import { createNavigationComponents } from './navigation';
import { createFeedbackComponents } from './feedback';
import { createGlobalComponents } from './global';
import { createTableComponents } from './tables';
import { createButtonComponents } from './buttons';

export const createComponents = (mode: 'light' | 'dark'): Components<Theme> => {
  return {
    ...createGlobalComponents(mode),
    ...createLayoutComponents(mode),
    ...createButtonComponents(mode),
    ...createFormFieldComponents(mode),
    ...createTableComponents(mode),
    ...createNavigationComponents(mode),
    ...createFeedbackComponents(mode),
  };
};