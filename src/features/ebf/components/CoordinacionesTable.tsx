'use client';

import React, { useState } from 'react';
import { Typography } from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import {
  DataTable,
  type DataTableAction,
  type DataTableColumn,
} from '@/shared/components/ui';
import { formatDate, formatDateTime } from '@/shared/utils';
import { useCoordinaciones } from '../hooks/useEbf';
import type { CoordinacionListItem } from '../types/coordinacion';
import { EditCoordinacionDialog } from './EditCoordinacionDialog';
import { DeleteCoordinacionDialog } from './DeleteCoordinacionDialog';

/** Ruta del detalle; `historico` se arrastra para que "Volver" regrese a la misma vista. */
const coordinacionDetailHref =(detalleId: string, historico = false) =>
  `/ebf/coordinaciones/${encodeURIComponent(detalleId)}${historico ? '?vista=historico' : ''}`;

const COLUMNS: DataTableColumn<CoordinacionListItem>[] = [
  {
    key: 'etd',
    label: 'ETD',
    description: 'Fecha estimada de salida del vuelo',
    value: (r) => formatDate(r.etd, ''),
  },
  {
    key: 'awb',
    label: 'AWB',
    description: 'Guía aérea master',
    value: (r) => r.awb,
    render: (r) => (
      <Typography component="span" variant="inherit" fontWeight={600}>
        {r.awb ?? '—'}
      </Typography>
    ),
    mobile: 'title',
  },
  {
    key: 'exportador',
    label: 'Exportador',
    value: (r) => r.exportador,
    maxWidth: 240,
    mobile: 'subtitle',
  },
  {
    key: 'marcacion',
    label: 'Marcación',
    description: 'Marca / consignatario al que va la carga',
    value: (r) => r.marcacion,
    maxWidth: 200,
  },
  { key: 'producto', label: 'Producto', value: (r) => r.producto, maxWidth: 180 },
  {
    key: 'bxsCoo',
    label: 'Cajas',
    description:
      'Cajas coordinadas en equivalente full: 1 media caja = 0,5; 1 cuarto = 0,25 (BXS-COO en el portal)',
    value: (r) => r.bxsCoo,
    align: 'right',
  },
  {
    key: 'destinoFinal',
    label: 'Destino final',
    description: 'Ciudad o aeropuerto donde se entrega la carga',
    value: (r) => r.destinoFinal,
  },
  {
    key: 'dae',
    label: 'DAE',
    description: 'Declaración Aduanera de Exportación',
    value: (r) => r.dae,
    defaultHidden: true,
  },
  {
    key: 'hawb',
    label: 'HAWB',
    description: 'Guía hija (house AWB) asignada por EBF',
    value: (r) => r.hawb,
    defaultHidden: true,
  },
  {
    key: 'pcsCoo',
    label: 'Piezas',
    description: 'Cajas físicas coordinadas, sin importar su tamaño (PCS-COO en el portal)',
    value: (r) => r.pcsCoo,
    align: 'right',
    defaultHidden: true,
  },
  {
    key: 'bxsWh',
    label: 'Cajas bodega',
    description: 'Cajas en equivalente full recibidas en bodega (BXS-WH en el portal)',
    value: (r) => r.bxsWh,
    align: 'right',
    defaultHidden: true,
  },
  {
    key: 'pcsWh',
    label: 'Piezas bodega',
    description: 'Cajas físicas recibidas en bodega (PCS-WH en el portal)',
    value: (r) => r.pcsWh,
    align: 'right',
    defaultHidden: true,
  },
  {
    key: 'origen',
    label: 'Origen',
    description: 'Aeropuerto de salida',
    value: (r) => r.origen,
    defaultHidden: true,
  },
  {
    key: 'destinoAwb',
    label: 'Destino AWB',
    description: 'Aeropuerto de destino de la guía master',
    value: (r) => r.destinoAwb,
    defaultHidden: true,
  },
  {
    key: 'creacion',
    label: 'Creada',
    description: 'Fecha y hora en que se registró la coordinación',
    value: (r) => (r.creacionFecha ? formatDateTime(r.creacionFecha) : r.creacion),
    defaultHidden: true,
  },
  {
    key: 'creacionUser',
    label: 'Creada por',
    description: 'Usuario del portal que registró la coordinación',
    value: (r) => r.creacionUser,
    defaultHidden: true,
  },
];

interface Props {
  includeHistorico?: boolean;
  /** Controles extra para la barra de la tabla (p.ej. el selector Vigentes | Histórico). */
  filters?: React.ReactNode;
}

export function CoordinacionesTable({ includeHistorico = false, filters }: Props) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteRow, setDeleteRow] = useState<CoordinacionListItem | null>(null);
  const {
    page: data,
    error,
    isValidating,
    mutate,
    refresh,
    refreshing,
    refreshError,
  } = useCoordinaciones({ page, includeHistorico });

  const rows = data?.items ?? [];
  const openDetail = (r: CoordinacionListItem) => {
    if (r.detalleId) router.push(coordinacionDetailHref(r.detalleId, includeHistorico));
  };

  const noDetalle = (r: CoordinacionListItem) => !r.detalleId;
  const actions: DataTableAction<CoordinacionListItem>[] = [
    {
      label: 'Ver detalle',
      icon: <VisibilityIcon fontSize="small" />,
      onClick: openDetail,
      hidden: noDetalle,
    },
  ];
  // El histórico es solo consulta: el portal no permite editar ni eliminar.
  if (!includeHistorico) {
    actions.push(
      {
        label: 'Editar',
        icon: <EditIcon fontSize="small" />,
        onClick: (r) => {
          const id = parseInt(r.detalleId ?? '', 10);
          if (Number.isFinite(id)) setEditId(id);
        },
        hidden: noDetalle,
      },
      {
        label: 'Eliminar',
        icon: <DeleteIcon fontSize="small" />,
        color: 'error',
        onClick: (r) => setDeleteRow(r),
        hidden: noDetalle,
      },
    );
  }

  return (
    <>
      <DataTable
        id="ebf-coordinaciones"
        columns={COLUMNS}
        rows={rows}
        getRowId={(r, i) => r.detalleId ?? `${r.awb ?? ''}-${r.hawb ?? ''}-${i}`}
        loading={isValidating || refreshing}
        error={error ?? refreshError}
        onRetry={() => (error ? mutate() : refresh())}
        onRefresh={refresh}
        onRowClick={openDetail}
        isRowClickable={(r) => Boolean(r.detalleId)}
        actions={actions}
        searchable
        searchPlaceholder="Buscar exportador, AWB, marcación, DAE…"
        filters={filters}
        pagination={{
          page: data?.page ?? page,
          hasNextPage: Boolean(data?.hasNextPage),
          onPageChange: setPage,
        }}
        emptyMessage={
          includeHistorico
            ? 'No hay coordinaciones en el histórico.'
            : 'No hay coordinaciones vigentes.'
        }
      />

      <EditCoordinacionDialog
        detalleId={editId}
        open={editId != null}
        onClose={() => setEditId(null)}
        // Tras guardar/eliminar se salta la caché del back para ver el cambio al instante.
        onUpdated={refresh}
      />
      <DeleteCoordinacionDialog
        row={deleteRow}
        onClose={() => setDeleteRow(null)}
        onDeleted={refresh}
      />
    </>
  );
}
