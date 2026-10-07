'use client';

import { use } from 'react';
import { CoordinacionDetailView } from '../../../../../features/ebf';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ vista?: string | string[] }>;
}

export default function EbfCoordinacionDetallePage({ params, searchParams }: Props) {
  const { id } = use(params);
  const { vista } = use(searchParams);
  // "Volver" regresa a la misma vista desde la que se abrió el detalle.
  const backHref =
    vista === 'historico' ? '/ebf/coordinaciones?vista=historico' : '/ebf/coordinaciones';
  return <CoordinacionDetailView id={id} backHref={backHref} />;
}
