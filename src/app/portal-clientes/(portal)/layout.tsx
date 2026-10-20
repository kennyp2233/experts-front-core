import { PortalClientesLayout } from '@/features/portal-clientes';

/** Marco con cabecera y pestañas; las hojas de impresión (../imprimir) van sin él. */
export default function Layout({ children }: { children: React.ReactNode }) {
  return <PortalClientesLayout>{children}</PortalClientesLayout>;
}
