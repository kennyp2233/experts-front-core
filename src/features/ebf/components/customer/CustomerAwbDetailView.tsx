'use client';

import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
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
import {
  useCustomerAwbCustomers,
  useCustomerAwbDetails,
  useCustomerAwbDocuments,
  useCustomerAwbHeader,
} from '../../hooks/useCustomerAwbs';

type TabKey = 'INFO' | 'CUSTOMERS' | 'DOCUMENTS';

interface Props {
  awbId: number;
}

export function CustomerAwbDetailView({ awbId }: Props) {
  const [tab, setTab] = useState<TabKey>('INFO');
  const { header, error: headerErr, isLoading: headerLoading } =
    useCustomerAwbHeader(awbId);

  if (headerErr) {
    return (
      <Alert severity="error">
        No se pudo cargar el AWB {awbId}: {(headerErr as Error).message}
      </Alert>
    );
  }
  if (headerLoading || !header) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Button
          size="small"
          component={Link}
          href="/ebf/customer/awbs"
          startIcon={<ArrowBackIcon />}
        >
          Volver
        </Button>
        <Typography variant="h5" fontWeight={600}>
          AWB {header.awbNumber}
        </Typography>
      </Stack>

      <Card variant="outlined">
        <CardContent>
          <Grid container spacing={2}>
            <Field label="AWB" value={header.awbNumber} />
            <Field label="Airline" value={header.airline} />
            <Field label="ETD / ETA" value={`${header.etd ?? '—'} / ${header.eta ?? '—'}`} />
            <Field label="Consignee" value={header.consignee} />
            <Field label="Shipper" value={header.shipper} />
            <Field label="Route" value={header.route} />
          </Grid>
          {header.documentCount > 0 && (
            <Box sx={{ mt: 2 }}>
              <Chip
                size="small"
                color="primary"
                label={`${header.documentCount} documento${header.documentCount === 1 ? '' : 's'}`}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      <Tabs
        value={tab}
        onChange={(_, v: TabKey) => setTab(v)}
        textColor="primary"
        indicatorColor="primary"
      >
        <Tab label="Info" value="INFO" />
        <Tab label="Customers" value="CUSTOMERS" />
        <Tab
          label={`Documents (${header.documentCount})`}
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
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <Grid size={{ xs: 12, md: 4 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={500}>
        {value ?? '—'}
      </Typography>
    </Grid>
  );
}

function InfoTabContent({ awbId }: { awbId: number }) {
  const { details, error, isLoading } = useCustomerAwbDetails(awbId);

  if (error) {
    return (
      <Alert severity="error">
        Error cargando detalles: {(error as Error).message}
      </Alert>
    );
  }
  if (isLoading || !details) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1}>
        <Button
          variant="contained"
          size="small"
          startIcon={<DownloadIcon />}
          component="a"
          href={details.exportXlsxUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Descargar XLSX
        </Button>
        <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
          {details.filters.customers.length} consignees ·{' '}
          {details.filters.shippers.length} shippers ·{' '}
          {details.filters.trucks.length} trucks
        </Typography>
      </Stack>

      {/* HTML raw del portal — renderizado directo. Los hx-* attrs quedan inertes
          sin htmx cargado, no requieren saneamiento (origen confiable). */}
      <Box
        sx={{
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

function CustomersTabContent({ awbId }: { awbId: number }) {
  const { customers, error, isLoading } = useCustomerAwbCustomers(awbId);

  if (error) {
    return (
      <Alert severity="error">
        Error cargando customers: {(error as Error).message}
      </Alert>
    );
  }
  if (isLoading || !customers) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const NUM = (n: number) => n.toLocaleString('es-EC', { maximumFractionDigits: 3 });

  return (
    <Box
      component="table"
      sx={{
        width: '100%',
        borderCollapse: 'collapse',
        '& th, & td': {
          border: '1px solid',
          borderColor: 'divider',
          padding: '8px',
        },
        '& thead th': { fontWeight: 600, textAlign: 'left' },
      }}
    >
      <thead>
        <tr>
          <th>#</th>
          <th>Consignee</th>
          <th>Truck</th>
          <th style={{ textAlign: 'right' }}>BXS-COO</th>
          <th style={{ textAlign: 'right' }}>PCS-COO</th>
          <th style={{ textAlign: 'right' }}>BXS-WH</th>
          <th style={{ textAlign: 'right' }}>PCS-WH</th>
        </tr>
      </thead>
      <tbody>
        {customers.rows.length === 0 ? (
          <tr>
            <td colSpan={7} style={{ textAlign: 'center' }}>
              Sin filas.
            </td>
          </tr>
        ) : (
          customers.rows.map((r) => (
            <tr key={r.index}>
              <td>{r.index}</td>
              <td>{r.consignee ?? '—'}</td>
              <td>{r.truck ?? '—'}</td>
              <td style={{ textAlign: 'right' }}>{NUM(r.bxsCoo)}</td>
              <td style={{ textAlign: 'right' }}>{NUM(r.pcsCoo)}</td>
              <td style={{ textAlign: 'right' }}>{NUM(r.bxsWh)}</td>
              <td style={{ textAlign: 'right' }}>{NUM(r.pcsWh)}</td>
            </tr>
          ))
        )}
      </tbody>
    </Box>
  );
}

function DocumentsTabContent({ awbId }: { awbId: number }) {
  const { documents, error, isLoading } = useCustomerAwbDocuments(awbId);

  if (error) {
    return (
      <Alert severity="error">
        Error cargando documentos: {(error as Error).message}
      </Alert>
    );
  }
  if (isLoading || !documents) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      {documents.hasDocuments && (
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
      )}
      {documents.documents.length === 0 ? (
        <Alert severity="info">No hay documentos publicados para este AWB.</Alert>
      ) : (
        <Box
          component="table"
          sx={{
            width: '100%',
            borderCollapse: 'collapse',
            '& th, & td': {
              border: '1px solid',
              borderColor: 'divider',
              padding: '8px',
            },
          }}
        >
          <thead>
            <tr>
              <th style={{ width: 60 }}>#</th>
              <th>Archivo</th>
              <th style={{ width: 80 }}>Tipo</th>
              <th style={{ width: 120, textAlign: 'center' }}>Descargar</th>
            </tr>
          </thead>
          <tbody>
            {documents.documents.map((d) => (
              <tr key={d.index}>
                <td>{d.index}</td>
                <td>{d.fileName}</td>
                <td>{d.fileType ?? '—'}</td>
                <td style={{ textAlign: 'center' }}>
                  <Button
                    size="small"
                    component="a"
                    href={d.downloadUrl}
                    startIcon={<DownloadIcon />}
                  >
                    Abrir
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Box>
      )}
    </Stack>
  );
}
