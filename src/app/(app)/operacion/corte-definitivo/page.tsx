import ProtectedRoute from '@/features/auth/components/ProtectedRoute';
import { CorteDefinitivoPage } from '@/features/operacion/components/corte/CorteDefinitivoPage';

export default function Page() {
  // Solo ADMIN: los demás vuelven a su inicio.
  return (
    <ProtectedRoute rolesPermitidos={['ADMIN']}>
      <CorteDefinitivoPage />
    </ProtectedRoute>
  );
}
