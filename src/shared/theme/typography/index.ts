import { headings } from './headings';
import { body } from './body';
import { interactive } from './interactive';

// Fuente del sistema (Segoe UI en Windows, SF en Mac, Roboto en Android). Es la
// que siempre se vio: Poppins estaba declarada pero su @import nunca cargaba, y
// cargarla de verdad ensanchaba las tablas (DAEs, coordinaciones) hasta desbordar.
export const FUENTE = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export const typography = {
  fontFamily: FUENTE,
  ...headings,
  ...body,
  ...interactive,
};
