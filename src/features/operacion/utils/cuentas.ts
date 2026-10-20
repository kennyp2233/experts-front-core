import { toIsoDate } from '@/shared/utils';
import type { CodigoAgencia, ConceptoAerolineaCampo } from '../types/coordinacion';
import type { CobroGuia, EtiquetasAgencia } from '../types/cuentas';

const nf2 = new Intl.NumberFormat('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Importe sin símbolo, siempre con 2 decimales ("1.325,20"); null → "—". */
export const monto = (v: number | null | undefined): string => (v === null || v === undefined ? '—' : nf2.format(v));

/** Igual que `monto`, pero un cero queda en blanco (para columnas de cargos poco frecuentes). */
export const montoOVacio = (v: number | null | undefined): string => (!v ? '' : nf2.format(v));

/** Redondeo a centavos (las sumas de decimales de JS arrastran basura). */
export const r2 = (v: number): number => Math.round((v + Number.EPSILON) * 100) / 100;

export const sumar = <T,>(filas: T[], f: (x: T) => number | null | undefined): number =>
  r2(filas.reduce((s, x) => s + (f(x) ?? 0), 0));

/** Nombre de cada cargo de agencia como se le explica al cliente (el código de la guía va aparte). */
export const NOMBRE_CARGO_AGENCIA: Record<CodigoAgencia, string> = {
  cargoAwa: 'Form A',
  cargoCha: 'Transport',
  cargoPca: 'PCA',
  cargoTax: 'Termógrafo',
  cargoMma: 'MCA',
  cargoHawb: 'Tax',
  cargoFitos: 'Fitos',
};

export const NOMBRE_CARGO_AEROLINEA: Record<ConceptoAerolineaCampo, string> = {
  guiaAerea: 'Guía aérea',
  combustible: 'Combustible',
  seguridad: 'Seguridad',
  otros: 'Otros',
  aux1: 'Auxiliar 1',
  aux2: 'Auxiliar 2',
  calAux: 'Cálculo auxiliar',
};

/** "Form A (FOA)"; si el código es igual al nombre ("Tax" / "Tax"), solo el nombre. */
export const textoCargoAgencia = (k: CodigoAgencia, etiquetas?: Partial<EtiquetasAgencia>): string => {
  const nombre = NOMBRE_CARGO_AGENCIA[k];
  const codigo = etiquetas?.[k]?.trim();
  return codigo && codigo.toLowerCase() !== nombre.toLowerCase() ? `${nombre} (${codigo})` : nombre;
};

/** Cargos de agencia que tienen valor en alguna de las guías (en el orden de la guía). */
export const codigosConValor = (filas: CobroGuia[], orden: readonly CodigoAgencia[]): CodigoAgencia[] =>
  orden.filter((k) => filas.some((f) => (f.cargosAgencia?.[k] ?? 0) !== 0));

// ----- Períodos -----

export interface Periodo {
  desde: string;
  hasta: string;
}

const pad = (n: number) => String(n).padStart(2, '0');
const ultimoDia = (y: number, m0: number) => new Date(y, m0 + 1, 0).getDate();
const iso = (y: number, m0: number, d: number) => `${y}-${pad(m0 + 1)}-${pad(d)}`;

/** Año y mes (0-11) de un "YYYY-MM-DD". */
const anioMes = (dia: string): [number, number] => [Number(dia.slice(0, 4)), Number(dia.slice(5, 7)) - 1];

export const mesDe = (dia: string): Periodo => {
  const [y, m] = anioMes(dia);
  return { desde: iso(y, m, 1), hasta: iso(y, m, ultimoDia(y, m)) };
};

export const hoyIso = (): string => toIsoDate(new Date());

export interface AtajoPeriodo {
  clave: string;
  label: string;
  ayuda: string;
  /** `base` = el "desde" elegido (las quincenas son del mes que se está viendo). */
  rango: (base: string, hoy: string) => Periodo;
}

export const ATAJOS_PERIODO: AtajoPeriodo[] = [
  {
    clave: 'q1',
    label: '1ª quincena',
    ayuda: 'Del 1 al 15 del mes que se está viendo',
    rango: (base) => {
      const [y, m] = anioMes(base);
      return { desde: iso(y, m, 1), hasta: iso(y, m, 15) };
    },
  },
  {
    clave: 'q2',
    label: '2ª quincena',
    ayuda: 'Del 16 al fin del mes que se está viendo',
    rango: (base) => {
      const [y, m] = anioMes(base);
      return { desde: iso(y, m, 16), hasta: iso(y, m, ultimoDia(y, m)) };
    },
  },
  { clave: 'mes', label: 'Mes actual', ayuda: 'Del 1 al último día de este mes', rango: (_, hoy) => mesDe(hoy) },
  {
    clave: 'anterior',
    label: 'Mes anterior',
    ayuda: 'El mes pasado completo',
    rango: (_, hoy) => {
      const [y, m] = anioMes(hoy);
      return mesDe(iso(m === 0 ? y - 1 : y, m === 0 ? 11 : m - 1, 1));
    },
  },
];

/** Query string de los filtros de cuentas (sin vacíos). */
export const queryCuentas = (f: Record<string, string | number | boolean | undefined | null>): string => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) if (v !== undefined && v !== null && v !== '' && v !== false) p.set(k, String(v));
  return p.toString();
};
