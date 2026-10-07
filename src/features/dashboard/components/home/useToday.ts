'use client';

import { useSyncExternalStore } from 'react';
import { parseDate } from '@/shared/utils/format';

export type PartOfDay = 'morning' | 'afternoon' | 'evening';

const pad = (n: number) => String(n).padStart(2, '0');

// "yyyy-MM-dd|parte del día": cambia pocas veces al día, así que los
// componentes solo se re-renderizan cuando realmente cambia algo visible.
const readSnapshot = (): string => {
  const now = new Date();
  const h = now.getHours();
  const part: PartOfDay = h < 12 ? 'morning' : h < 19 ? 'afternoon' : 'evening';
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}|${part}`;
};

const subscribe = (onChange: () => void) => {
  const id = window.setInterval(onChange, 60_000);
  return () => window.clearInterval(id);
};

export interface Today {
  /** Fecha local de hoy (medianoche). `null` solo durante el render en servidor. */
  today: Date | null;
  partOfDay: PartOfDay | null;
}

/**
 * "Hoy" del navegador, sin desajustes de hidratación (en el servidor es null)
 * y actualizado solo al cambiar de día o de franja horaria.
 */
export function useToday(): Today {
  const snapshot = useSyncExternalStore(subscribe, readSnapshot, () => null);
  if (!snapshot) return { today: null, partOfDay: null };
  const [iso, part] = snapshot.split('|');
  return { today: parseDate(iso), partOfDay: part as PartOfDay };
}
