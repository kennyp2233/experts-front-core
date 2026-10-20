'use client';

import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { Print as ImprimirIcon } from '@mui/icons-material';
import { getErrorMessage } from '@/shared/utils';
import {
  armarLiquidacion,
  COLUMNAS_COBRO,
  fechaCorta,
  fechaLarga,
  formatoGuia,
  num,
  useEstadoCuenta,
  useGuiaCliente,
  usd,
} from './portal';

// Hojas para imprimir del portal de clientes: HTML y CSS propios (blanco y
// negro, sin depender del tema claro/oscuro de la app).
const CSS = `
.ph-fondo { background: #e5e7eb; min-height: 100vh; }
.ph-barra { position: sticky; top: 0; z-index: 1; display: flex; align-items: center; gap: 12px; padding: 12px 24px;
  background: #fff; color: #000; border-bottom: 1px solid #d1d5db; }
.ph-hoja { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #fff; color: #000; font: 10pt Arial, Helvetica, sans-serif; margin: 16px auto; box-sizing: border-box; padding: 12mm; }
.ph-hoja.vertical { width: 210mm; min-height: 297mm; }
.ph-hoja.horizontal { width: 297mm; min-height: 210mm; padding: 8mm; font-size: 8.5pt; }
.ph-hoja h1 { font-size: 15pt; margin: 0 0 1mm; }
.ph-hoja h2 { font-size: 10pt; margin: 0 0 1.5mm; text-transform: uppercase; letter-spacing: .04em; }
.ph-sub { color: #444; margin: 0 0 5mm; }
.ph-cajas { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; margin-bottom: 6mm; }
.ph-caja { border: 0.3mm solid #000; padding: 2.5mm 3mm; line-height: 1.45; }
.ph-hoja table { width: 100%; border-collapse: collapse; }
.ph-liq td { padding: 1.4mm 2mm; border-bottom: 0.2mm solid #bbb; vertical-align: top; }
.ph-liq td.v { text-align: right; white-space: nowrap; }
.ph-liq tr.seccion td { background: #eee; font-weight: 700; text-transform: uppercase; font-size: 8.5pt; }
.ph-liq tr.linea td:first-child { padding-left: 7mm; }
.ph-liq tr.subtotal td, .ph-liq tr.total td { font-weight: 700; }
.ph-liq tr.total td { border-top: 0.4mm solid #000; }
.ph-liq tr.pagar td { background: #ddd; color: #000; font-size: 12pt; border-top: 0.6mm solid #000; border-bottom: 0.6mm solid #000; }
.ph-liq .det { display: block; font-weight: 400; font-size: 8pt; color: #555; }
.ph-cobros th, .ph-cobros td { border: 0.2mm solid #888; padding: 1mm 1.4mm; }
.ph-cobros th { background: #eee; font-size: 7.5pt; }
.ph-cobros td.r, .ph-cobros th.r { text-align: right; white-space: nowrap; }
.ph-cobros tfoot td { font-weight: 700; background: #f3f3f3; }
.ph-cobros thead { display: table-header-group; }
.ph-cobros tr { break-inside: avoid; }
.ph-pie { margin-top: 5mm; font-size: 8pt; color: #444; }
@media print {
  .ph-fondo { background: #fff; }
  .no-imprimir { display: none !important; }
  .ph-hoja { margin: 0; padding: 0; width: auto !important; min-height: 0 !important; }
}
`;

function Barra({ titulo, listo }: { titulo: string; listo: boolean }) {
  return (
    <div className="ph-barra no-imprimir">
      <Typography variant="h6" sx={{ flex: 1, color: '#000' }}>
        {titulo}
      </Typography>
      <Button variant="contained" startIcon={<ImprimirIcon />} disabled={!listo} onClick={() => window.print()}>
        Imprimir
      </Button>
      <Button onClick={() => window.close()}>Cerrar</Button>
    </div>
  );
}

function Estado({ cargando, error, mensaje }: { cargando: boolean; error: unknown; mensaje: string }) {
  if (error) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        {getErrorMessage(error, mensaje)}
      </Alert>
    );
  }
  return cargando ? <CircularProgress sx={{ m: 4 }} /> : null;
}

/** Liquidación de una guía (A4 vertical): lo que se le cobra al cliente. */
export function LiquidacionImpresion({ id }: { id: number }) {
  const { data: g, error, isLoading } = useGuiaCliente(id);
  const l = g?.liquidacion ?? null;
  const f = l?.clienteFactura;

  return (
    <Box className="ph-fondo">
      <style>{CSS}</style>
      <style>{'@page { size: A4 portrait; margin: 12mm; }'}</style>
      <Barra titulo={g ? `Liquidación · guía ${formatoGuia(g.numeroGuia)}` : 'Liquidación'} listo={!!l} />
      <Estado cargando={isLoading} error={error} mensaje="No se pudo cargar la liquidación." />
      {g && !l && (
        <Alert severity="info" sx={{ m: 3 }}>
          Esta guía todavía no tiene liquidación: se genera cuando la guía se despacha.
        </Alert>
      )}
      {g && l && (
        <div className="ph-hoja vertical">
          <h1>Experts Handling Cargo</h1>
          <p className="ph-sub">Liquidación de la guía {formatoGuia(g.numeroGuia)}</p>

          <div className="ph-cajas">
            <div className="ph-caja">
              <h2>Cliente</h2>
              <strong>{f?.nombre ?? l.cliente?.nombre ?? '—'}</strong>
              {f?.ruc && <div>RUC {f.ruc}</div>}
              {f?.direccion && <div>{f.direccion}</div>}
              {f?.telefono && <div>Tel. {f.telefono}</div>}
            </div>
            <div className="ph-caja">
              <h2>Guía</h2>
              <div>
                <strong>{formatoGuia(g.numeroGuia)}</strong> · {g.aerolinea?.nombre ?? '—'}
              </div>
              <div>Vuelo del {fechaLarga(g.fechaVuelo)}</div>
              <div>
                Marca: {g.marca?.nombre ?? '—'} · Destino: {g.destino?.nombre ?? '—'}
              </div>
              <div>
                {num(l.piezas)} piezas · {num(l.fulls)} fulls · {num(l.pesoBruto)} kg
              </div>
            </div>
          </div>

          <table className="ph-liq">
            <tbody>
              {armarLiquidacion(l).map((r, i) => (
                <tr key={i} className={r.tipo === 'total' && r.concepto === 'TOTAL A PAGAR' ? 'total pagar' : r.tipo}>
                  <td colSpan={r.tipo === 'seccion' ? 2 : 1}>
                    {r.concepto}
                    {r.detalle && <span className="det">{r.detalle}</span>}
                  </td>
                  {r.tipo !== 'seccion' && <td className="v">{usd(r.valor)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="ph-pie">Valores en dólares de los Estados Unidos (USD). Total a pagar = total de la guía + handling.</p>
        </div>
      )}
    </Box>
  );
}

/** Estado de cuenta del período (A4 horizontal). */
export function EstadoCuentaImpresion({ desde, hasta, idCliente }: { desde: string; hasta: string; idCliente?: number }) {
  const { data, error, isLoading } = useEstadoCuenta({ desde, hasta, idCliente });
  const filas = data?.filas ?? [];

  return (
    <Box className="ph-fondo">
      <style>{CSS}</style>
      <style>{'@page { size: A4 landscape; margin: 8mm; }'}</style>
      <Barra titulo="Estado de cuenta" listo={!!data && filas.length > 0} />
      <Estado cargando={isLoading} error={error} mensaje="No se pudo cargar el estado de cuenta." />
      {data && (
        <div className="ph-hoja horizontal">
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <div>
              <h1>Experts Handling Cargo</h1>
              <p className="ph-sub">
                Estado de cuenta del {fechaCorta(data.desde)} al {fechaCorta(data.hasta)}
              </p>
            </div>
            <div style={{ textAlign: 'right', lineHeight: 1.45 }}>
              <strong>{data.cliente.nombreFactura ?? data.cliente.nombre}</strong>
              {data.cliente.ruc && <div>RUC {data.cliente.ruc}</div>}
              {data.cliente.direccion && <div>{data.cliente.direccion}</div>}
            </div>
          </Stack>
          {filas.length === 0 ? (
            <p>No hay guías despachadas en este período.</p>
          ) : (
            <table className="ph-cobros">
              <thead>
                <tr>
                  {COLUMNAS_COBRO.map((c) => (
                    <th key={c.key} className={c.align === 'right' ? 'r' : undefined}>
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.id}>
                    {COLUMNAS_COBRO.map((c) => (
                      <td key={c.key} className={c.align === 'right' ? 'r' : undefined}>
                        {c.celda(f)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  {COLUMNAS_COBRO.map((c, i) => (
                    <td key={c.key} className={c.align === 'right' ? 'r' : undefined}>
                      {i === 0 ? 'Totales' : (c.pie?.(data.totales, filas) ?? '')}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          )}
          <p className="ph-pie">
            Valores en dólares de los Estados Unidos (USD). Total a pagar = total de la guía + handling (el handling se cobra aparte del total de la guía).
          </p>
        </div>
      )}
    </Box>
  );
}
