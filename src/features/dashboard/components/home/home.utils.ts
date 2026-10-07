import { parseDate, type DateInput } from '@/shared/utils/format';

/**
 * Días calendario desde `today` hasta la fecha (negativo si ya pasó).
 * Igual que `daysFromToday`, pero con "hoy" explícito para que el render sea
 * puro y se recalcule solo cuando cambia el día.
 */
export function daysFrom(today: Date, value: DateInput): number | null {
  const d = parseDate(value);
  if (!d) return null;
  const a = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const b = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((b - a) / 86_400_000);
}

const normalize = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/**
 * Columna de "fin de vigencia" en la lista de DAEs del portal EBF. Las columnas
 * llegan como texto del portal, así que se busca sin mayúsculas ni tildes.
 */
export function findVigenciaColumn(columns: string[]): string | null {
  const candidates = columns.map((c) => ({ c, n: normalize(c) }));
  return (
    candidates.find(({ n }) => n.includes('fin') && n.includes('vigencia'))?.c ??
    candidates.find(({ n }) => n.includes('vigencia') && /hasta|venc/.test(n))?.c ??
    null
  );
}

/** "50+" cuando hay más páginas en el portal. */
export function formatCount(n: number, hasMore = false): string {
  return `${n.toLocaleString('es-EC')}${hasMore ? '+' : ''}`;
}

/** Primer nombre legible: "KENNY ANDRES" -> "Kenny". */
export function firstNameOf(name?: string | null): string {
  const first = (name ?? '').trim().split(/\s+/)[0] ?? '';
  if (!first) return '';
  return first === first.toUpperCase()
    ? first.charAt(0) + first.slice(1).toLowerCase()
    : first;
}

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** "Martes, 6 de octubre de 2026". */
export function formatLongDate(date: Date): string {
  return capitalize(
    new Intl.DateTimeFormat('es-EC', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date),
  );
}

/** "Hoy", "Mañana", "Jue." (esta semana) o "dd/MM". */
export function relativeDayLabel(date: Date, days: number): string {
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Mañana';
  if (days > 1 && days < 7) {
    return capitalize(new Intl.DateTimeFormat('es-EC', { weekday: 'short' }).format(date));
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
}
