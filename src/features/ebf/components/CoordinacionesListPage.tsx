'use client';

import { Button, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AppPage } from '@/shared/components/ui';
import { CoordinacionesTable } from './CoordinacionesTable';
import { EbfHealthBadge } from './EbfHealthBadge';

type Vista = 'vigentes' | 'historico';

/**
 * Pantalla única de coordinaciones: Vigentes e Histórico comparten tabla y se
 * eligen con `?vista=historico` (así los links y el botón "atrás" funcionan).
 * Usa `useSearchParams`: la página que la monta debe envolverla en <Suspense>.
 */
export function CoordinacionesListPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const vista: Vista = searchParams.get('vista') === 'historico' ? 'historico' : 'vigentes';

  const changeVista = (next: Vista | null) => {
    if (!next || next === vista) return;
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'historico') params.set('vista', 'historico');
    else params.delete('vista');
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <AppPage
      title="Coordinaciones"
      subtitle="Vigentes: despacho en curso (solo las de hoy se pueden editar o eliminar). Histórico: coordinaciones anteriores, solo consulta."
      actions={
        <>
          <EbfHealthBadge />
          <Button
            component={Link}
            href="/ebf/coordinaciones/nueva"
            variant="contained"
            startIcon={<AddIcon />}
          >
            Nueva coordinación
          </Button>
        </>
      }
    >
      <CoordinacionesTable
        // Remonta al cambiar de vista: vuelve a la página 1 y limpia la búsqueda.
        key={vista}
        includeHistorico={vista === 'historico'}
        filters={
          <ToggleButtonGroup
            exclusive
            size="small"
            color="primary"
            value={vista}
            onChange={(_, v: Vista | null) => changeVista(v)}
            aria-label="Vista de coordinaciones"
          >
            <ToggleButton value="vigentes" sx={{ px: 2 }}>
              Vigentes
            </ToggleButton>
            <ToggleButton value="historico" sx={{ px: 2 }}>
              Histórico
            </ToggleButton>
          </ToggleButtonGroup>
        }
      />
    </AppPage>
  );
}
