import { redirect } from 'next/navigation';

/** El menú Guías del sistema viejo arranca en el ingreso. */
export default function Page() {
  redirect('/operacion/guias/ingresos');
}
