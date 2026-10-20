'use client';

import useSWR from 'swr';
import { Typography } from '@mui/material';
import { DataTable, type DataTableColumn } from '@/shared/components/ui';
import { formatDate, formatDateTime } from '@/shared/utils';
import { operacionService } from '../services/operacion.service';
import type { CoordinacionAnulada } from '../types/coordinacion';
import { formatoAwb, nombreCorto, num } from '../utils/formato';

const columnas: DataTableColumn<CoordinacionAnulada>[] = [
  { key: 'numero', label: 'N°', value: (a) => a.numero, render: (a) => <strong>{a.numero ?? '—'}</strong> },
  { key: 'guia', label: 'Guía', value: (a) => a.numeroGuia, render: (a) => <span style={{ fontFamily: 'monospace' }}>{formatoAwb(a.numeroGuia)}</span> },
  { key: 'vuelo', label: 'Vuelo', value: (a) => a.fechaVuelo, render: (a) => (a.fechaVuelo ? formatDate(a.fechaVuelo) : '—') },
  { key: 'aerolinea', label: 'Aerolínea', value: (a) => nombreCorto(a.aerolinea) },
  { key: 'consignatario', label: 'Consignatario', value: (a) => a.consignatario?.nombre ?? '' },
  { key: 'fulls', label: 'Fulls', align: 'right', value: (a) => a.totalFulls, render: (a) => num(a.totalFulls) },
  { key: 'cajas', label: 'Cajas', align: 'right', value: (a) => a.totalCajas, render: (a) => num(a.totalCajas, 0) },
  { key: 'motivo', label: 'Motivo', value: (a) => a.motivo ?? '', render: (a) => a.motivo ?? <Typography variant="body2" color="text.disabled">—</Typography> },
  {
    key: 'anulada',
    label: 'Anulada',
    value: (a) => a.anuladoEn,
    render: (a) => (
      <span>
        {a.anuladoEn ? formatDateTime(a.anuladoEn) : '—'}
        {a.anuladoPor ? ` · ${a.anuladoPor}` : ''}
      </span>
    ),
  },
];

/**
 * Coordinaciones anuladas en el sistema nuevo: qué se anuló, quién, cuándo y
 * por qué (el viejo lo dejaba en la cabecera con docEstado 0 y dDocUsuario).
 */
export function AnuladasTabla({ dia }: { dia?: string }) {
  const { data, error, isLoading, mutate } = useSWR(['coordinaciones-anuladas', dia ?? ''], () =>
    operacionService.coordinacionesAnuladas(dia, dia),
  );
  return (
    <DataTable
      id="operacion-coordinaciones-anuladas"
      columns={columnas}
      rows={data ?? []}
      getRowId={(a) => String(a.id)}
      loading={isLoading}
      error={error}
      onRetry={() => mutate()}
      onRefresh={() => mutate()}
      emptyMessage={
        dia ? `No hay coordinaciones anuladas con vuelo el ${formatDate(dia)}.` : 'No hay coordinaciones anuladas en el sistema nuevo.'
      }
      dense
    />
  );
}
