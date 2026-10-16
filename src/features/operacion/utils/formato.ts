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

/** Tarifa por kg, siempre con 2 decimales ("2,60"). */
export const tarifa = (v: number | null | undefined): string => (v === null || v === undefined ? '—' : dinero.format(v));

/** "Ref" de dato maestro: código · nombre, o solo uno de los dos. */
export const nombreRef = (r: { codigo: string | null; nombre: string } | null | undefined): string =>
  !r ? '—' : r.codigo && r.codigo !== r.nombre ? `${r.nombre} (${r.codigo})` : r.nombre;

/** Nombre corto (alias del sistema viejo) si lo hay; si no, el nombre. */
export const nombreCorto = (r: { nombre: string; alias?: string | null } | null | undefined): string =>
  !r ? '—' : r.alias || r.nombre;

/**
 * Guía madre como la escribe el sistema viejo: "369-8469 5461". Acepta
 * "369-84695461", "36984695461" o ya formateada.
 */
export function formatoAwb(numero: string | null | undefined): string {
  if (!numero) return '—';
  const d = numero.replace(/\D/g, '');
  return d.length === 11 ? `${d.slice(0, 3)}-${d.slice(3, 7)} ${d.slice(7)}` : numero;
}

/** "1 finca" / "3 fincas". */
export const plural = (n: number, singular: string, pluralTxt = `${singular}s`) =>
  `${num(n, 0)} ${n === 1 ? singular : pluralTxt}`;

/** N° del ingreso de guías como lo imprime el sistema viejo: "CGU-0003871". */
export const textoIngreso = (n: number | null | undefined): string => (n ? `CGU-${String(n).padStart(7, '0')}` : '—');

/**
 * Orden dentro de un día de vuelo, como la lista vieja ("extFechaDespacho DESC,
 * aerAlias, marAlias"): por aerolínea y después por consignatario.
 */
export const ordenDelDia = (
  a: { aerolinea: { nombre: string; alias?: string | null } | null; consignatario: { nombre: string } | null },
  b: { aerolinea: { nombre: string; alias?: string | null } | null; consignatario: { nombre: string } | null },
) =>
  nombreCorto(a.aerolinea).localeCompare(nombreCorto(b.aerolinea)) ||
  (a.consignatario?.nombre ?? '').localeCompare(b.consignatario?.nombre ?? '');
