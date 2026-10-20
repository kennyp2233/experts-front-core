'use client';

import { useState } from 'react';
import useSWR from 'swr';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { Print as ImprimirIcon } from '@mui/icons-material';
import api from '@/shared/services/api';
import { getErrorMessage } from '@/shared/utils';
import { CSS_MANIFIESTO_LAN, ManifiestoLan } from './ManifiestoLanImpresion';

/** Lo que usa el manifiesto de `GET /operacion/coordinaciones/:id/guias-hijas/impresion`. */
interface GuiaHija {
  numero: string;
  finca: { nombre: string; ruc: string | null; direccion?: string[]; telefono?: string | null; ciudad?: string | null; pais?: string | null };
  consignee?: string[];
  dae: string | null;
  piezas: number;
  kg: number;
  fulls: number;
  productos: string[];
}

interface DatosManifiesto {
  mawb: string | null;
  fecha: string;
  empresa: { nombre: string; ruc: string };
  origen: { codigo: string; aeropuerto: string };
  destino: { codigo: string | null; aeropuerto: string | null };
  aerolinea: string | null;
  vuelo?: string | null;
  consignee: string[];
  consigneeMaster?: string[];
  tipoEmbarque: string | null;
  manifiesto: string | null;
  guias: GuiaHija[];
}

const nf = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
const nf2 = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type Formato = 'general' | 'lan';

/** Aerolíneas con `||FormatoLAN` en `aerPlantilla` del viejo (LAN CARGO, LATAM): salen con el "Formato LAN". */
const esLan = (aerolinea: string | null) => /\b(lan|latam)\b/i.test(aerolinea ?? '');

// Formato general: A4 horizontal; el encabezado de la tabla se repite en cada hoja y el pie lleva el número de página.
const PAGINA_GENERAL = `
@page { size: A4 landscape; margin: 10mm 10mm 12mm;
  @bottom-right { content: "Page " counter(page) " / " counter(pages); font: 8pt Arial, Helvetica, sans-serif; } }
`;
// Formato LAN (FormatoLAN.xlt): A4 vertical con 3 columnas ocultas; con "Con datos" las 9 columnas, en horizontal.
const paginaLan = (conDatos: boolean) => `@page { size: A4 ${conDatos ? 'landscape' : 'portrait'}; margin: 7mm; }`;

const CSS = `
.man-hojas { display: flex; justify-content: center; padding: 8mm 0; }
.man { width: 277mm; box-sizing: border-box; background: #fff; color: #000; padding: 6mm; font: 8pt Arial, Helvetica, sans-serif;
  box-shadow: 0 1px 4px rgba(0,0,0,.25); }
.man * { box-sizing: border-box; }
.man h1 { font-size: 14pt; text-align: center; margin: 0 0 3mm; letter-spacing: 0.4pt; }
.man .cab { display: grid; grid-template-columns: 1fr 1fr; border: 0.3mm solid #000; border-bottom: none; margin-bottom: 3mm; }
.man .cab > div { display: grid; grid-template-columns: 30mm 1fr; gap: 2mm; padding: 1mm 2mm; border-bottom: 0.3mm solid #000; }
.man .cab > div:nth-child(odd) { border-right: 0.3mm solid #000; }
.man .cab .k { font-size: 6.5pt; font-style: italic; text-transform: uppercase; }
.man .cab .val { font-weight: 700; text-transform: uppercase; white-space: pre-line; }
.man table { width: 100%; border-collapse: collapse; }
.man thead { display: table-header-group; }
.man tr { break-inside: avoid; page-break-inside: avoid; }
.man th, .man td { border: 0.2mm solid #000; padding: 0.8mm 1.2mm; vertical-align: top; text-align: left; }
.man th { font-size: 7pt; background: #e5e7eb; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.man td { text-transform: uppercase; }
.man .n { text-align: right; white-space: nowrap; }
.man .chico { font-size: 7pt; }
.man .total td { font-weight: 700; background: #f3f4f6; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
@media print {
  body * { visibility: hidden; }
  .man-hojas, .man-hojas * { visibility: visible; }
  .man-hojas { padding: 0; display: block; }
  .man { box-shadow: none; width: auto; padding: 0; }
  .no-imprimir { display: none !important; }
  .man-raiz { min-height: 0 !important; background: #fff !important; }
}
`;

function Dato({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <span className="k">{k}</span>
      <span className="val">{v || '—'}</span>
    </div>
  );
}

function Manifiesto({ d }: { d: DatosManifiesto }) {
  const tot = d.guias.reduce((s, g) => ({ piezas: s.piezas + g.piezas, kg: s.kg + g.kg, fulls: s.fulls + g.fulls }), {
    piezas: 0,
    kg: 0,
    fulls: 0,
  });
  const origen = `${d.origen.codigo} ${d.origen.aeropuerto}`;
  const destino = [d.destino.codigo, d.destino.aeropuerto].filter(Boolean).join(' ');
  return (
    <div className="man">
      <h1>CONSOLIDATED CARGO MANIFEST</h1>
      <div className="cab">
        <Dato k="MAWB" v={d.mawb ?? ''} />
        <Dato k="Airline" v={d.aerolinea ?? ''} />
        <Dato k="Flight / Date" v={[d.vuelo, d.fecha].filter(Boolean).join(' / ')} />
        <Dato k="Route" v={`${origen} → ${destino}`} />
        <Dato k="Consolidator" v={[d.empresa.nombre, d.empresa.ruc ? `RUC ${d.empresa.ruc}` : ''].filter(Boolean).join('\n')} />
        <Dato k="Master consignee" v={(d.consigneeMaster?.length ? d.consigneeMaster : d.consignee).join('\n')} />
        <Dato k="Manifest" v={d.manifiesto ?? ''} />
        <Dato k="Nature of goods" v={d.tipoEmbarque ?? ''} />
      </div>
      <table>
        <thead>
          <tr>
            <th style={{ width: '6mm' }}>#</th>
            <th style={{ width: '20mm' }}>HAWB</th>
            <th>SHIPPER</th>
            <th style={{ width: '48mm' }}>CONSIGNEE</th>
            <th className="n" style={{ width: '13mm' }}>PCS</th>
            <th className="n" style={{ width: '17mm' }}>KGS</th>
            <th className="n" style={{ width: '14mm' }}>FULLS</th>
            <th style={{ width: '36mm' }}>DAE</th>
            <th style={{ width: '40mm' }}>DESCRIPTION</th>
          </tr>
        </thead>
        <tbody>
          {d.guias.map((g, i) => (
            <tr key={g.numero}>
              <td className="n chico">{i + 1}</td>
              <td>{g.numero}</td>
              <td>
                {g.finca.nombre}
                {g.finca.ruc && <div className="chico">RUC {g.finca.ruc}</div>}
              </td>
              <td>{(g.consignee?.length ? g.consignee : d.consignee)[0] ?? ''}</td>
              <td className="n">{nf.format(g.piezas)}</td>
              <td className="n">{nf.format(g.kg)}</td>
              <td className="n">{nf2.format(g.fulls)}</td>
              <td>{g.dae ?? ''}</td>
              <td className="chico">{g.productos.join(', ')}</td>
            </tr>
          ))}
          <tr className="total">
            <td colSpan={4}>
              TOTAL · {d.guias.length} {d.guias.length === 1 ? 'HAWB' : 'HAWBS'}
            </td>
            <td className="n">{nf.format(tot.piezas)}</td>
            <td className="n">{nf.format(tot.kg)}</td>
            <td className="n">{nf2.format(tot.fulls)}</td>
            <td colSpan={2} />
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/**
 * Manifiesto consolidado de la guía (como "Manifiesto (Formato Aerolínea)" del
 * viejo): A4 horizontal, una fila por guía hija con shipper (finca), consignee,
 * piezas, kilos, fulls, DAE y productos, y los totales.
 */
export function ManifiestoImpresion({ id }: { id: number }) {
  const { data, error, isLoading } = useSWR<DatosManifiesto>(['operacion/impresion-hijas', id, undefined], async () =>
    (await api.get(`/operacion/coordinaciones/${id}/guias-hijas/impresion`)).data,
  );
  // Formato: el que corresponde a la aerolínea (LAN → "Formato LAN"), salvo que se elija otro.
  const [elegido, setElegido] = useState<Formato | null>(null);
  const [conDatos, setConDatos] = useState(false);
  const formato: Formato = elegido ?? (data && esLan(data.aerolinea) ? 'lan' : 'general');
  // El shipper master (D6 de FormatoLAN) no viene en guias-hijas/impresion: sale de la guía madre.
  const { data: madre, error: errorMadre } = useSWR<{ shipper: string[] }>(
    formato === 'lan' ? ['operacion/impresion-madre-shipper', id] : null,
    async () => (await api.get(`/operacion/coordinaciones/${id}/guia-madre/impresion`)).data,
    { revalidateOnFocus: false },
  );

  return (
    <Box className="man-raiz" sx={{ bgcolor: '#e5e7eb', minHeight: '100vh' }}>
      <style>{CSS + (formato === 'lan' ? CSS_MANIFIESTO_LAN + paginaLan(conDatos) : PAGINA_GENERAL)}</style>
      <Stack
        className="no-imprimir"
        direction="row"
        spacing={2}
        alignItems="center"
        useFlexGap
        flexWrap="wrap"
        sx={{ position: 'sticky', top: 0, zIndex: 1, bgcolor: 'background.paper', px: 3, py: 1.5, borderBottom: 1, borderColor: 'divider' }}
      >
        <Typography variant="h6" sx={{ flex: 1 }}>
          Manifiesto {data ? `· guía ${data.mawb ?? ''} · ${data.guias.length} ${data.guias.length === 1 ? 'guía hija' : 'guías hijas'}` : ''}
        </Typography>
        <ToggleButtonGroup size="small" exclusive value={formato} onChange={(_, v: Formato | null) => v && setElegido(v)}>
          <ToggleButton value="general">General</ToggleButton>
          <ToggleButton value="lan">Formato LAN</ToggleButton>
        </ToggleButtonGroup>
        {formato === 'lan' && (
          <FormControlLabel
            control={<Checkbox size="small" checked={conDatos} onChange={(e) => setConDatos(e.target.checked)} />}
            label="Con datos (shipper / consignee)"
          />
        )}
        <Button variant="contained" startIcon={<ImprimirIcon />} disabled={!data} onClick={() => window.print()}>
          Imprimir
        </Button>
        <Button onClick={() => window.close()}>Cerrar</Button>
      </Stack>
      {formato === 'lan' && errorMadre && (
        <Alert severity="warning" sx={{ m: 3, mb: 0 }} className="no-imprimir">
          No se pudo leer el shipper de la guía madre: la columna SHIPPER MASTER queda vacía.
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ m: 3 }} className="no-imprimir">
          {getErrorMessage(error, 'No se pudo armar el manifiesto.')}
        </Alert>
      )}
      {isLoading && <CircularProgress sx={{ m: 4 }} />}
      {data && (
        <div className="man-hojas">
          {formato === 'lan' ? <ManifiestoLan d={data} shipper={madre?.shipper ?? null} conDatos={conDatos} /> : <Manifiesto d={data} />}
        </div>
      )}
    </Box>
  );
}
