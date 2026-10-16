const nf = (max: number, min = 0) =>
  new Intl.NumberFormat('es-EC', { minimumFractionDigits: min, maximumFractionDigits: max });

const entero = nf(0);
const dos = nf(2);
const dinero = nf(2, 2);

/** Número con hasta `decimales` decimales; null → "—". */
export const num = (v: number | null | undefined, decimales = 2): string =>
  v === null || v === undefined ? '—' : (decimales === 0 ? entero : decimales === 2 ? dos : nf(decimales)).format(v);

/** Importe en USD con 2 decimales; null → "—". */
export const usd = (v: number | null | undefined): string =>
  v === null || v === undefined ? '—' : `$ ${dinero.format(v)}`;

/** Kilos sin decimales innecesarios. */
export const kg = (v: number | null | undefined): string => (v === null || v === undefined ? '—' : `${dos.format(v)} kg`);

/** "Ref" de dato maestro: código · nombre, o solo uno de los dos. */
export const nombreRef = (r: { codigo: string | null; nombre: string } | null | undefined): string =>
  !r ? '—' : r.codigo && r.codigo !== r.nombre ? `${r.nombre} (${r.codigo})` : r.nombre;
