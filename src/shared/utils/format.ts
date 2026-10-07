/**
 * Formato único de fechas para toda la app: dd/MM/yyyy y dd/MM/yyyy HH:mm.
 *
 * Las fuentes (Access, portal EBF, Postgres) devuelven formatos distintos:
 *   "2026-10-06", "2026-10-06T00:00:00.000Z", "2023/08/07",
 *   "29/09/2026", "06-10-2026 14:40", "07-Oct-2026".
 * `parseDate` los normaliza a un Date local (sin corrimiento de zona horaria
 * para fechas sin hora).
 */

const MONTHS: Record<string, number> = {
  jan: 0, ene: 0, feb: 1, mar: 2, apr: 3, abr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, ago: 7, sep: 8, set: 8, oct: 9, nov: 10, dec: 11, dic: 11,
};

const pad = (n: number) => String(n).padStart(2, '0');

const build = (y: number, m: number, d: number, hh = 0, mm = 0): Date | null => {
  const date = new Date(y, m, d, hh, mm);
  return date.getFullYear() === y && date.getMonth() === m && date.getDate() === d ? date : null;
};

export type DateInput = string | Date | null | undefined;

export function parseDate(value: DateInput): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  const s = value.trim();
  if (!s) return null;

  // yyyy-MM-dd o yyyy/MM/dd (opcional hora). Solo fecha -> local, sin UTC.
  let m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T ](\d{1,2}):(\d{2}))?/);
  if (m) {
    const hasZone = /T.*(Z|[+-]\d{2}:?\d{2})$/.test(s);
    if (hasZone) {
      const d = new Date(s);
      return isNaN(d.getTime()) ? null : d;
    }
    return build(+m[1], +m[2] - 1, +m[3], m[4] ? +m[4] : 0, m[5] ? +m[5] : 0);
  }

  // dd/MM/yyyy o dd-MM-yyyy (opcional HH:mm)
  m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (m) return build(+m[3], +m[2] - 1, +m[1], m[4] ? +m[4] : 0, m[5] ? +m[5] : 0);

  // dd-Mon-yyyy (EBF: "07-Oct-2026")
  m = s.match(/^(\d{1,2})[-\s]([A-Za-z]{3})[a-z]*[-\s](\d{4})/);
  if (m) {
    const month = MONTHS[m[2].toLowerCase()];
    if (month !== undefined) return build(+m[3], month, +m[1]);
  }

  return null;
}

const hasTime = (value: DateInput) =>
  value instanceof Date || (typeof value === 'string' && /\d{1,2}:\d{2}/.test(value));

/** "dd/MM/yyyy". Si no se puede interpretar, devuelve el texto original. */
export function formatDate(value: DateInput, fallback = '—'): string {
  if (!value) return fallback;
  const d = parseDate(value);
  if (!d) return typeof value === 'string' ? value : fallback;
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** "dd/MM/yyyy HH:mm" cuando el valor trae hora; si no, igual que formatDate. */
export function formatDateTime(value: DateInput, fallback = '—'): string {
  if (!value) return fallback;
  const d = parseDate(value);
  if (!d) return typeof value === 'string' ? value : fallback;
  const date = formatDate(d);
  return hasTime(value) ? `${date} ${pad(d.getHours())}:${pad(d.getMinutes())}` : date;
}

/** "yyyy-MM-dd" para inputs type=date y query params. */
export function toIsoDate(value: DateInput): string {
  const d = parseDate(value);
  return d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : '';
}

/** Días calendario desde hoy hasta la fecha (negativo si ya pasó). */
export function daysFromToday(value: DateInput): number | null {
  const d = parseDate(value);
  if (!d) return null;
  const today = new Date();
  const a = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const b = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((b - a) / 86_400_000);
}
