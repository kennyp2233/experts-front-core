import { redirect } from 'next/navigation';

/** Ruta antigua: el histórico ahora es una vista de /ebf/coordinaciones. */
export default function EbfHistoricoPage() {
  redirect('/ebf/coordinaciones?vista=historico');
}
