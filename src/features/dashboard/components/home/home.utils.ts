/** "50+" cuando hay más resultados que los que se trajeron. */
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
