'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { Print as ImprimirIcon } from '@mui/icons-material';
import { formatDate, getErrorMessage } from '@/shared/utils';
import { useEmpresaEmisor, useEstadoCuenta } from '../../hooks/useCuentas';
import { CODIGOS_AGENCIA } from '../../types/coordinacion';
import type { EmpresaEmisor } from '../../types/cuentas';
import { formatoAwb, num } from '../../utils/formato';
import { codigosConValor, hoyIso, mesDe, monto, montoOVacio, sumar, textoCargoAgencia } from '../../utils/cuentas';

const EMPRESA_POR_DEFECTO: EmpresaEmisor = { nombre: 'EXPERTS HANDLING CARGO S.A.', ruc: '' };

// Estado de cuenta en A4 horizontal; el encabezado de la tabla se repite en cada hoja.
const CSS = `
@page { size: A4 landscape; margin: 10mm 8mm 12mm;
  @bottom-right { content: "Página " counter(page) " / " counter(pages); font: 8pt Arial, Helvetica, sans-serif; } }
.ec-hojas { display: flex; justify-content: center; padding: 8mm 0; }
.ec { width: 281mm; box-sizing: border-box; background: #fff; color: #000; padding: 7mm; font: 8pt Arial, Helvetica, sans-serif;
  box-shadow: 0 1px 4px rgba(0,0,0,.25); }
.ec * { box-sizing: border-box; }
.ec .cab { display: flex; justify-content: space-between; gap: 8mm; margin-bottom: 4mm; }
.ec .emisor .nombre { font-size: 12pt; font-weight: 700; }
.ec .emisor div { line-height: 1.3; }
.ec h1 { font-size: 14pt; margin: 0 0 1mm; text-align: right; letter-spacing: 0.3pt; }
.ec .periodo { text-align: right; font-size: 9pt; }
.ec .cliente { border: 0.3mm solid #000; padding: 2mm 3mm; margin-bottom: 4mm; display: grid; grid-template-columns: 1fr auto; gap: 6mm; align-items: end; }
.ec .cliente .k { font-size: 7pt; font-style: italic; text-transform: uppercase; }
.ec .cliente .fuerte { font-size: 10.5pt; font-weight: 700; }
.ec .cliente .pagar { text-align: right; }
.ec .cliente .pagar .v { font-size: 13pt; font-weight: 700; font-variant-numeric: tabular-nums; }
.ec table { width: 100%; border-collapse: collapse; }
.ec thead { display: table-header-group; }
.ec tr { break-inside: avoid; page-break-inside: avoid; }
.ec th, .ec td { border: 0.2mm solid #000; padding: 0.8mm 1.2mm; vertical-align: top; text-align: left; }
.ec th { font-size: 7pt; background: #e5e7eb; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.ec .n { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
.ec .nb { white-space: nowrap; }
.ec .tot { font-weight: 700; }
.ec .total td { font-weight: 700; background: #f3f4f6; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.ec .pend { font-style: italic; color: #92400e; }
.ec .nota { margin-top: 3mm; font-size: 7pt; color: #374151; }
@media print {
  body * { visibility: hidden; }
  .ec-hojas, .ec-hojas * { visibility: visible; }
  .ec-hojas { padding: 0; display: block; }
  .ec { box-shadow: none; width: auto; padding: 0; }
  .no-imprimir { display: none !important; }
  .ec-raiz { min-height: 0 !important; background: #fff !important; }
}
`;

/**
 * Estado de cuenta de un cliente para imprimir (A4 horizontal), con los datos de
 * facturación del cliente arriba. Filtros en la URL: ?cliente=&desde=&hasta=&abiertas=1.
 * La página que la monta la envuelve en <Suspense> (usa `useSearchParams`).
 */
export function EstadoCuentaImpresion() {
  const sp = useSearchParams();
  const mes = useMemo(() => mesDe(hoyIso()), []);
  const idCliente = sp.get('cliente') ? Number(sp.get('cliente')) || null : null;
  const desde = sp.get('desde') ?? mes.desde;
  const hasta = sp.get('hasta') ?? mes.hasta;
  const incluirAbiertas = sp.get('abiertas') === '1';

  const { estado, error, isLoading } = useEstadoCuenta(
    idCliente ? { idCliente, desde, hasta, incluirAbiertas } : null,
  );
  const filas = useMemo(() => estado?.filas ?? [], [estado]);
  const codigos = useMemo(() => codigosConValor(filas, CODIGOS_AGENCIA), [filas]);
  // Las cuentas no traen el emisor: se toma de los parámetros de la empresa (vía una coordinación cualquiera).
  const empresa = useEmpresaEmisor(filas[0]?.id) ?? EMPRESA_POR_DEFECTO;
  const cli = estado?.cliente;
  const etiquetas = estado?.etiquetasAgencia;

  const emisorLineas = [
    empresa.ruc ? `RUC ${empresa.ruc}` : null,
    empresa.direccion,
    [empresa.ciudad, empresa.pais].filter(Boolean).join(', '),
    empresa.telefono ? `Tel. ${empresa.telefono}` : null,
  ].filter(Boolean);
  const clienteLineas = [
    cli?.ruc ? `RUC ${cli.ruc}` : null,
    cli?.direccion,
    [cli?.ciudad, cli?.pais].filter(Boolean).join(', '),
    cli?.telefono ? `Tel. ${cli.telefono}` : null,
  ].filter(Boolean);
  const hayAbiertas = filas.some((f) => f.estado !== 'CORTADO');

  return (
    <Box className="ec-raiz" sx={{ bgcolor: '#e5e7eb', minHeight: '100vh' }}>
      <style>{CSS}</style>
      <Stack
        className="no-imprimir"
        direction="row"
        spacing={2}
        alignItems="center"
        sx={{ position: 'sticky', top: 0, zIndex: 1, bgcolor: 'background.paper', px: 3, py: 1.5, borderBottom: 1, borderColor: 'divider' }}
      >
        <Typography variant="h6" sx={{ flex: 1 }}>
          Estado de cuenta {cli ? `· ${cli.nombreFactura || cli.nombre}` : ''}
        </Typography>
        <Button variant="contained" startIcon={<ImprimirIcon />} disabled={!estado || filas.length === 0} onClick={() => window.print()}>
          Imprimir
        </Button>
        <Button onClick={() => window.close()}>Cerrar</Button>
      </Stack>
      {!idCliente && (
        <Alert severity="warning" sx={{ m: 3 }} className="no-imprimir">
          Falta el cliente. Vuelve a Estado de cuenta y elige uno.
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ m: 3 }} className="no-imprimir">
          {getErrorMessage(error, 'No se pudo armar el estado de cuenta.')}
        </Alert>
      )}
      {isLoading && <CircularProgress sx={{ m: 4 }} />}
      {estado && filas.length === 0 && (
        <Alert severity="info" sx={{ m: 3 }} className="no-imprimir">
          El cliente no tiene guías con vuelo en ese período.
        </Alert>
      )}
      {estado && filas.length > 0 && (
        <div className="ec-hojas">
          <div className="ec">
            <div className="cab">
              <div className="emisor">
                <div className="nombre">{empresa.nombre}</div>
                {emisorLineas.map((t) => (
                  <div key={t as string}>{t}</div>
                ))}
              </div>
              <div>
                <h1>ESTADO DE CUENTA</h1>
                <div className="periodo">
                  Vuelos del <b>{formatDate(estado.desde)}</b> al <b>{formatDate(estado.hasta)}</b>
                </div>
                <div className="periodo">Emitido el {formatDate(hoyIso())}</div>
              </div>
            </div>
            <div className="cliente">
              <div>
                <div className="k">Cliente</div>
                <div className="fuerte">{cli?.nombreFactura || cli?.nombre}</div>
                <div>{clienteLineas.join(' · ')}</div>
              </div>
              <div className="pagar">
                <div className="k">Total a pagar (USD)</div>
                <div className="v">{monto(sumar(filas, (f) => f.totalCobrar))}</div>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Guía</th>
                  <th>Marca</th>
                  <th>Destino</th>
                  <th className="n">Piezas</th>
                  <th className="n">Kg</th>
                  <th className="n">Peso cobrable</th>
                  <th className="n">Tarifa</th>
                  <th className="n">Flete</th>
                  <th className="n">Cargos aerolínea</th>
                  {codigos.map((k) => (
                    <th key={k} className="n">
                      {textoCargoAgencia(k, etiquetas)}
                    </th>
                  ))}
                  <th className="n">IVA</th>
                  <th className="n">Total guía</th>
                  <th className="n">Handling</th>
                  <th className="n">Total a pagar</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.id}>
                    <td className="nb">{formatDate(f.fechaVuelo)}</td>
                    <td className="nb">
                      {formatoAwb(f.numeroGuia)}
                      {f.estado !== 'CORTADO' && <span className="pend"> *</span>}
                    </td>
                    <td>{f.marca?.nombre}</td>
                    <td className="nb">{f.destino?.codigo ?? f.destino?.nombre}</td>
                    <td className="n">{num(f.piezas, 0)}</td>
                    <td className="n">{num(f.pesoBruto)}</td>
                    <td className="n">{num(f.pesoCobrable)}</td>
                    <td className="n">{monto(f.tarifa)}</td>
                    <td className="n">{monto(f.flete)}</td>
                    <td className="n">{monto(f.dueCarrier)}</td>
                    {codigos.map((k) => (
                      <td key={k} className="n">
                        {montoOVacio(f.cargosAgencia?.[k])}
                      </td>
                    ))}
                    <td className="n">{monto(f.iva)}</td>
                    <td className="n">{monto(f.totalGuia)}</td>
                    <td className="n">{monto(f.handling)}</td>
                    <td className="n tot">{monto(f.totalCobrar)}</td>
                  </tr>
                ))}
                <tr className="total">
                  <td colSpan={4}>
                    TOTAL · {filas.length} {filas.length === 1 ? 'guía' : 'guías'}
                  </td>
                  <td className="n">{num(sumar(filas, (f) => f.piezas), 0)}</td>
                  <td className="n">{num(sumar(filas, (f) => f.pesoBruto))}</td>
                  <td className="n">{num(sumar(filas, (f) => f.pesoCobrable))}</td>
                  <td />
                  <td className="n">{monto(sumar(filas, (f) => f.flete))}</td>
                  <td className="n">{monto(sumar(filas, (f) => f.dueCarrier))}</td>
                  {codigos.map((k) => (
                    <td key={k} className="n">
                      {monto(sumar(filas, (f) => f.cargosAgencia?.[k]))}
                    </td>
                  ))}
                  <td className="n">{monto(sumar(filas, (f) => f.iva))}</td>
                  <td className="n">{monto(sumar(filas, (f) => f.totalGuia))}</td>
                  <td className="n">{monto(sumar(filas, (f) => f.handling))}</td>
                  <td className="n">{monto(sumar(filas, (f) => f.totalCobrar))}</td>
                </tr>
              </tbody>
            </table>
            <div className="nota">
              Total guía = flete + cargos de aerolínea + cargos de agencia + IVA. El handling es el servicio de Experts y se suma aparte. Valores en USD.
              {hayAbiertas && <span className="pend"> * Guía que todavía no se corta: valores provisorios.</span>}
            </div>
          </div>
        </div>
      )}
    </Box>
  );
}
