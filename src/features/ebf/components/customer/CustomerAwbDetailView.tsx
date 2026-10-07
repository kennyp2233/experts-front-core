'use client';

import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import {
  Download as DownloadIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { AppPage, DataTable, type DataTableColumn } from '@/shared/components/ui';
import { formatDate, getErrorMessage } from '@/shared/utils';
import {
  useCustomerAwbCustomers,
  useCustomerAwbDetails,
  useCustomerAwbDocuments,
  useCustomerAwbHeader,
} from '../../hooks/useCustomerAwbs';
import type {
  CustomerAwbCustomerRow,
  CustomerAwbDocument,
} from '../../types/customer-awb';

type TabKey = 'INFO' | 'CUSTOMERS' | 'DOCUMENTS';

const LIST_HREF = '/ebf/customer/awbs';

interface Props {
  awbId: number;
}

const NUM = (n: number) => n.toLocaleString('es-EC', { maximumFractionDigits: 3 });

function BackButton() {
  return (
    <Button size="small" component={Link} href={LIST_HREF} startIcon={<ArrowBackIcon />}>
      AWBs
    </Button>
  );
}

function Loading() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
      <CircularProgress />
    </Box>
  );
}

function ErrorAlert({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <Alert
      severity="error"
      action={
        <Button color="inherit" size="small" onClick={onRetry}>
          Reintentar
        </Button>
      }
    >
      {getErrorMessage(error)}
    </Alert>
  );
}

export function CustomerAwbDetailView({ awbId }: Props) {
  const [tab, setTab] = useState<TabKey>('INFO');
  const {
    header,
    error: headerErr,
    isLoading: headerLoading,
    mutate: retryHeader,
  } = useCustomerAwbHeader(awbId);

  if (headerErr || headerLoading || !header) {
    return (
      <AppPage title="AWB" actions={<BackButton />}>
        {headerErr ? (
          <ErrorAlert error={headerErr} onRetry={() => retryHeader()} />
        ) : (
          <Loading />
        )}
      </AppPage>
    );
  }

  const etd = formatDate(header.etd);
  const eta = formatDate(header.eta);

  return (
    <AppPage
      title={`AWB ${header.awbNumber}`}
      subtitle={[header.consignee, header.route].filter(Boolean).join(' · ') || undefined}
      actions={<BackButton />}
    >
      <Stack spacing={2}>
        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, minmax(0, 1fr))',
                md: 'repeat(3, minmax(0, 1fr))',
              },
              gap: 2,
            }}
          >
            <Field label="AWB (guía master)" value={header.awbNumber} />
            <Field label="Aerolínea" value={header.airline} />
            <Field label="Ruta" value={header.route} />
            <Field label="ETD (salida estimada)" value={etd} />
            <Field label="ETA (llegada estimada)" value={eta} />
            <Field label="Consignatario" value={header.consignee} />
            <Field label="Exportador (shipper)" value={header.shipper} />
          </Box>
          {header.documentCount > 0 && (
            <Box sx={{ mt: 2 }}>
              <Chip
                size="small"
                color="primary"
                label={`${header.documentCount} documento${header.documentCount === 1 ? '' : 's'}`}
              />
            </Box>
          )}
        </Paper>

        <Tabs
          value={tab}
          onChange={(_, v: TabKey) => setTab(v)}
          textColor="primary"
          indicatorColor="primary"
          variant="scrollable"
          allowScrollButtonsMobile
        >
          <Tab label="Información" value="INFO" />
          <Tab label="Consignatarios" value="CUSTOMERS" />
          <Tab
            label={`Documentos (${header.documentCount})`}
            value="DOCUMENTS"
            disabled={header.documentCount === 0}
          />
        </Tabs>

        {tab === 'INFO' && <InfoTabContent awbId={awbId} />}
        {tab === 'CUSTOMERS' && <CustomersTabContent awbId={awbId} />}
        {tab === 'DOCUMENTS' && header.documentCount > 0 && (
          <DocumentsTabContent awbId={awbId} />
        )}
      </Stack>
    </AppPage>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500} sx={{ overflowWrap: 'anywhere' }}>
        {value || '—'}
      </Typography>
    </Box>
  );
}

function InfoTabContent({ awbId }: { awbId: number }) {
  const { details, error, isLoading, mutate } = useCustomerAwbDetails(awbId);

  if (error) return <ErrorAlert error={error} onRetry={() => mutate()} />;
  if (isLoading || !details) return <Loading />;

  const { customers, shippers, trucks } = details.filters;
  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
        <Button
          variant="contained"
          size="small"
          startIcon={<DownloadIcon />}
          component="a"
          href={details.exportXlsxUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Descargar Excel
        </Button>
        <Typography variant="caption" color="text.secondary">
          {plural(customers.length, 'consignatario', 'consignatarios')} ·{' '}
          {plural(shippers.length, 'exportador', 'exportadores')} ·{' '}
          {plural(trucks.length, 'camión', 'camiones')}
        </Typography>
      </Stack>

      {/* HTML raw del portal — renderizado directo. Los hx-* attrs quedan inertes
          sin htmx cargado, no requieren saneamiento (origen confiable). */}
      <Box
        sx={{
          overflowX: 'auto',
          '& table': {
            width: '100%',
            borderCollapse: 'collapse',
          },
          '& th, & td': {
            border: '1px solid',
            borderColor: 'divider',
            padding: '6px 8px',
            fontSize: '0.85rem',
          },
          '& .card': { mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 },
          '& .bg-blue-subtle': { bgcolor: 'info.light' },
          '& .bg-orange-subtle': { bgcolor: 'warning.light' },
        }}
        dangerouslySetInnerHTML={{ __html: details.rawTablesHtml }}
      />
    </Stack>
  );
}

const CUSTOMER_COLUMNS: DataTableColumn<CustomerAwbCustomerRow>[] = [
  { key: 'index', label: '#', value: (r) => r.index, align: 'right', mobile: 'hidden' },
  { key: 'consignee', label: 'Consignatario', value: (r) => r.consignee, maxWidth: 320, mobile: 'title' },
  { key: 'truck', label: 'Camión', description: 'Transporte que lleva la carga a bodega', value: (r) => r.truck, mobile: 'subtitle' },
  {
    key: 'bxsCoo',
    label: 'Cajas COO',
    description: 'Cajas coordinadas en equivalente full (BXS-COO)',
    value: (r) => NUM(r.bxsCoo),
    align: 'right',
  },
  {
    key: 'pcsCoo',
    label: 'Piezas COO',
    description: 'Cajas físicas coordinadas (PCS-COO)',
    value: (r) => NUM(r.pcsCoo),
    align: 'right',
  },
  {
    key: 'bxsWh',
    label: 'Cajas bodega',
    description: 'Cajas en equivalente full recibidas en bodega (BXS-WH)',
    value: (r) => NUM(r.bxsWh),
    align: 'right',
  },
  {
    key: 'pcsWh',
    label: 'Piezas bodega',
    description: 'Cajas físicas recibidas en bodega (PCS-WH)',
    value: (r) => NUM(r.pcsWh),
    align: 'right',
  },
];

function CustomersTabContent({ awbId }: { awbId: number }) {
  const { customers, error, isLoading, mutate } = useCustomerAwbCustomers(awbId);

  return (
    <DataTable
      id="ebf-customer-awb-consignatarios"
      columns={CUSTOMER_COLUMNS}
      rows={customers?.rows ?? []}
      getRowId={(r) => String(r.index)}
      loading={isLoading}
      error={error}
      onRetry={() => mutate()}
      hideToolbar
      emptyMessage="Este AWB no tiene consignatarios."
      maxHeight="none"
    />
  );
}

const DOCUMENT_COLUMNS: DataTableColumn<CustomerAwbDocument>[] = [
  { key: 'index', label: '#', value: (r) => r.index, align: 'right', mobile: 'hidden' },
  { key: 'fileName', label: 'Archivo', value: (r) => r.fileName, maxWidth: 420, mobile: 'title' },
  { key: 'fileType', label: 'Tipo', value: (r) => r.fileType },
  {
    key: 'download',
    label: 'Descargar',
    align: 'center',
    render: (r) => (
      <Button
        size="small"
        component="a"
        href={r.downloadUrl}
        startIcon={<DownloadIcon />}
        onClick={(e) => e.stopPropagation()}
      >
        Abrir
      </Button>
    ),
  },
];

function DocumentsTabContent({ awbId }: { awbId: number }) {
  const { documents, error, isLoading, mutate } = useCustomerAwbDocuments(awbId);

  return (
    <Stack spacing={2}>
      {documents?.hasDocuments && (
        <Box>
          <Button
            variant="contained"
            color="success"
            size="small"
            startIcon={<DownloadIcon />}
            component="a"
            href={documents.downloadAllUrl}
          >
            Descargar todos (ZIP)
          </Button>
        </Box>
      )}
      <DataTable
        id="ebf-customer-awb-documentos"
        columns={DOCUMENT_COLUMNS}
        rows={documents?.documents ?? []}
        getRowId={(r) => String(r.index)}
        loading={isLoading}
        error={error}
        onRetry={() => mutate()}
        hideToolbar
        emptyMessage="No hay documentos publicados para este AWB."
        maxHeight="none"
      />
    </Stack>
  );
}
