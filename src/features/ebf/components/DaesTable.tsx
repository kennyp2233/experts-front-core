'use client';

import { useMemo, useState } from 'react';
import { Chip, Stack } from '@mui/material';
import { DataTable, type DataTableColumn } from '@/shared/components/ui';
import { daysFromToday, formatDateTime, parseDate } from '@/shared/utils';
import { useDaes } from '../hooks/useEbf';
import type { DaeListItem } from '../types/dae';

/** Días antes del fin de vigencia en que se avisa. */
const WARN_DAYS = 7;

type Kind = 'text' | 'date' | 'vigente' | 'finVigencia';

interface ColumnMeta {
  label?: string;
  description?: string;
  kind?: Kind;
  hidden?: boolean;
  mobile?: DataTableColumn<DaeListItem>['mobile'];
  align?: DataTableColumn<DaeListItem>['align'];
}

/** "F. fin de vigencia" -> "f fin de vigencia" (sin tildes ni puntuación). */
const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/**
 * Columnas conocidas del listado de DAEs del portal (los nombres llegan tal
 * cual del HTML). Se comparan normalizados; la primera regla que coincide gana.
 * Columnas desconocidas se muestran con su nombre original.
 */
const RULES: { test: RegExp; meta: ColumnMeta }[] = [
  {
    test: /^(doc id|doc|id|documento id|id documento)$/,
    meta: { label: 'ID documento', description: 'Identificador interno del documento en el portal EBF', hidden: true },
  },
  {
    test: /^(reg|registro|n reg|no reg)$/,
    meta: { label: 'Registro', description: 'Número de registro interno del portal EBF', hidden: true },
  },
  {
    test: /^(f |fecha )?(creacion|creado|created)/,
    meta: { label: 'Creación', description: 'Fecha en que se cargó la DAE en el portal', kind: 'date', hidden: true },
  },
  {
    test: /^(f |fecha )?(actualizacion|actualizado|modificacion|ultima actualizacion|updated)/,
    meta: { label: 'Actualización', description: 'Última modificación en el portal', kind: 'date', hidden: true },
  },
  {
    test: /fin (de )?(la )?vigencia|vencimiento|vence|expiracion/,
    meta: {
      label: 'Fin de vigencia',
      description: `Último día en que la DAE puede usarse. Se avisa ${WARN_DAYS} días antes.`,
      kind: 'finVigencia',
    },
  },
  {
    test: /inicio (de )?(la )?vigencia/,
    meta: { label: 'Inicio de vigencia', description: 'Desde cuándo puede usarse la DAE', kind: 'date' },
  },
  {
    test: /^(vigente|vigencia|activa|activo|estado vigencia)$/,
    meta: { label: 'Vigente', description: 'Si la DAE todavía puede usarse para nuevos embarques', kind: 'vigente', align: 'center' },
  },
  {
    test: /^(dae|n dae|no dae|nro dae|numero dae|numero de dae|dae n|dae no|dae numero)$/,
    meta: { label: 'DAE', description: 'Número de la Declaración Aduanera de Exportación', mobile: 'title' },
  },
  { test: /exportador/, meta: { label: 'Exportador', mobile: 'subtitle' } },
  { test: /^(f |fecha )/, meta: { kind: 'date' } },
];

const metaFor = (column: string): ColumnMeta => {
  if (/^col\d+$/.test(column)) {
    // Columna sin encabezado en el portal (suele ser de botones).
    return { label: `Columna ${parseInt(column.slice(3), 10) + 1}`, hidden: true };
  }
  const n = norm(column);
  return RULES.find((r) => r.test.test(n))?.meta ?? {};
};

/** "F. emisión" -> "Fecha emisión"; el resto queda como viene. */
const prettyLabel = (column: string) =>
  column.replace(/^F\.\s*/i, 'Fecha ').replace(/^./, (c) => c.toUpperCase());

const DATE_LIKE = /^\d{1,4}[-/][0-9A-Za-z]{1,3}[-/]\d{2,4}(?:[ T]\d{1,2}:\d{2}.*)?$/;

/** Columna sin nombre conocido pero cuyos valores son fechas (≥80% de los no vacíos). */
const looksLikeDates = (values: string[]) => {
  const filled = values.filter(Boolean);
  if (filled.length === 0) return false;
  const dates = filled.filter((v) => DATE_LIKE.test(v) && parseDate(v) !== null);
  return dates.length / filled.length >= 0.8;
};

const cellRaw = (r: DaeListItem, column: string): unknown =>
  (r.raw as Record<string, unknown>)[column];

const asText = (v: unknown) => (v === null || v === undefined ? '' : String(v).trim());

/** Acepta 'Sí'/'No', 'SI'/'NO', true/false, '1'/'0'. null si no se reconoce o viene vacío. */
function parseVigente(v: unknown): boolean | null {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  const raw = asText(v);
  if (!raw) return null;
  if (/^[✓✔]$/.test(raw)) return true;
  if (/^[✗✘]$/.test(raw)) return false;
  const s = norm(raw);
  if (['si', 's', 'yes', 'y', 'true', '1', 'vigente', 'activa', 'activo'].includes(s)) return true;
  if (['no', 'n', 'false', '0', 'vencida', 'vencido', 'no vigente', 'inactiva', 'inactivo', 'caducada'].includes(s)) {
    return false;
  }
  return null;
}

function VigenteCell({ value }: { value: unknown }) {
  const text = asText(value);
  const vigente = parseVigente(value);
  if (vigente === null) return <>{text || '—'}</>;
  return (
    <Chip
      size="small"
      label={vigente ? 'Sí' : 'No'}
      color={vigente ? 'success' : 'default'}
      variant={vigente ? 'filled' : 'outlined'}
    />
  );
}

function FinVigenciaCell({ value, vigente }: { value: unknown; vigente: boolean | null }) {
  const text = asText(value);
  if (!text) return <>—</>;
  const days = daysFromToday(text);
  // Una DAE marcada como no vigente no necesita aviso de vencimiento.
  const warn = vigente !== false && days !== null && days >= 0 && days <= WARN_DAYS;
  const label = days === 0 ? 'Vence hoy' : days === 1 ? 'Vence mañana' : `Vence en ${days} días`;
  return (
    <Stack direction="row" spacing={1} alignItems="center" component="span">
      <span>{formatDateTime(text)}</span>
      {warn && <Chip size="small" color="warning" label={label} />}
    </Stack>
  );
}

export function DaesTable() {
  const [page, setPage] = useState(1);
  const {
    page: data,
    error,
    isValidating,
    mutate,
    refresh,
    refreshing,
    refreshError,
  } = useDaes({ page });

  const columns = useMemo<DataTableColumn<DaeListItem>[]>(() => {
    const items = data?.items ?? [];
    const names = data?.columns?.length ? data.columns : Object.keys(items[0]?.raw ?? {});
    const metas = names.map((name) => ({ name, meta: metaFor(name) }));
    const vigenteCol = metas.find((m) => m.meta.kind === 'vigente')?.name;
    const vigenteOf = (r: DaeListItem) =>
      parseVigente(vigenteCol ? asText(cellRaw(r, vigenteCol)) || r.vigente : r.vigente);

    return metas.map(({ name, meta }) => {
      const kind: Kind =
        meta.kind ?? (looksLikeDates(items.map((r) => asText(cellRaw(r, name)))) ? 'date' : 'text');
      const base: DataTableColumn<DaeListItem> = {
        key: name,
        label: meta.label ?? prettyLabel(name),
        description: meta.description,
        defaultHidden: meta.hidden,
        mobile: meta.mobile,
        align: meta.align,
        value: (r) => asText(cellRaw(r, name)),
      };
      switch (kind) {
        case 'date':
          return { ...base, value: (r) => formatDateTime(asText(cellRaw(r, name)), '') };
        case 'finVigencia':
          return {
            ...base,
            value: (r) => formatDateTime(asText(cellRaw(r, name)), ''),
            render: (r) => <FinVigenciaCell value={cellRaw(r, name)} vigente={vigenteOf(r)} />,
          };
        case 'vigente':
          return {
            ...base,
            value: (r) => {
              const v = vigenteOf(r);
              return v === null ? asText(cellRaw(r, name)) : v ? 'Sí' : 'No';
            },
            render: (r) => <VigenteCell value={asText(cellRaw(r, name)) || r.vigente} />,
          };
        default:
          return base;
      }
    });
  }, [data]);

  return (
    <DataTable
      id="ebf-daes"
      columns={columns}
      rows={data?.items ?? []}
      getRowId={(r, i) => `${i}-${Object.values(r.raw).slice(0, 3).join('|')}`}
      loading={isValidating || refreshing}
      error={error ?? refreshError}
      onRetry={() => (error ? mutate() : refresh())}
      onRefresh={refresh}
      searchable
      searchPlaceholder="Buscar DAE, exportador, destino…"
      pagination={{
        page: data?.page ?? page,
        hasNextPage: Boolean(data?.hasNextPage),
        onPageChange: setPage,
      }}
      emptyMessage="No hay DAEs para mostrar."
    />
  );
}
