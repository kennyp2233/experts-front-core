'use client';

import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { Print as ImprimirIcon } from '@mui/icons-material';
import { formatDate, getErrorMessage } from '@/shared/utils';
import { useEmpresaEmisor, useLiquidacionGuia } from '../../hooks/useCuentas';
import { CODIGOS_AGENCIA, CONCEPTOS_AEROLINEA } from '../../types/coordinacion';
import type { EmpresaEmisor, LiquidacionGuia } from '../../types/cuentas';
import { formatoAwb, nombreCorto, num } from '../../utils/formato';
import { hoyIso, monto, NOMBRE_CARGO_AEROLINEA, textoCargoAgencia } from '../../utils/cuentas';

const EMPRESA_POR_DEFECTO: EmpresaEmisor = { nombre: 'EXPERTS HANDLING CARGO S.A.', ruc: '' };

// Liquidación al cliente en hoja blanca A4 vertical (reemplaza al Shipment-Invoice del sistema viejo).
const CSS = `
@page { size: A4; margin: 12mm; }
.liq-hojas { display: flex; justify-content: center; padding: 8mm 0; }
.liq { width: 190mm; min-height: 270mm; box-sizing: border-box; background: #fff; color: #000; padding: 10mm; font: 9.5pt Arial, Helvetica, sans-serif;
  box-shadow: 0 1px 4px rgba(0,0,0,.25); }
.liq * { box-sizing: border-box; }
.liq .cab { display: flex; justify-content: space-between; gap: 8mm; border-bottom: 0.5mm solid #000; padding-bottom: 4mm; margin-bottom: 5mm; }
.liq .emisor .nombre { font-size: 13pt; font-weight: 700; }
.liq .emisor div { line-height: 1.35; }
.liq .titulo { text-align: right; }
.liq .titulo h1 { font-size: 15pt; margin: 0 0 1mm; letter-spacing: 0.3pt; }
.liq .titulo .sub { font-style: italic; font-size: 8.5pt; }
.liq .titulo .num { margin-top: 2mm; font-size: 9pt; }
.liq .prov { border: 0.4mm solid #b91c1c; color: #b91c1c; font-weight: 700; text-align: center; padding: 1.5mm; margin-bottom: 4mm; }
.liq .cajas { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; margin-bottom: 5mm; }
.liq .caja { border: 0.3mm solid #000; padding: 2.5mm 3mm; min-width: 0; }
.liq .caja h2 { font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.5pt; margin: 0 0 1.5mm; font-style: italic; font-weight: 400; }
.liq .caja .fuerte { font-weight: 700; font-size: 10.5pt; }
.liq .caja .fila { display: flex; justify-content: space-between; gap: 3mm; line-height: 1.5; }
.liq .caja .fila span:first-child { font-style: italic; }
.liq .caja .fila span:last-child { font-weight: 700; text-align: right; }
.liq table { width: 100%; border-collapse: collapse; margin-top: 2mm; }
.liq th { font-size: 8pt; text-align: left; background: #e5e7eb; border: 0.25mm solid #000; padding: 1.5mm 2mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.liq td { border: 0.25mm solid #9ca3af; padding: 1.4mm 2mm; vertical-align: top; }
.liq tr { break-inside: avoid; page-break-inside: avoid; }
.liq .n { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
.liq .grupo td { background: #f3f4f6; font-weight: 700; font-size: 8.5pt; text-transform: uppercase; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.liq .sangria { padding-left: 6mm; }
.liq .subtotal td { font-weight: 700; border-top: 0.4mm solid #000; }
.liq .total td { font-size: 12pt; font-weight: 700; background: #e5e7eb; border: 0.4mm solid #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.liq .nota { margin-top: 5mm; font-size: 8pt; color: #374151; line-height: 1.4; }
@media print {
  body * { visibility: hidden; }
  .liq-hojas, .liq-hojas * { visibility: visible; }
  .liq-hojas { padding: 0; display: block; }
  .liq { box-shadow: none; width: auto; min-height: 0; padding: 0; }
  .no-imprimir { display: none !important; }
  .liq-raiz { min-height: 0 !important; background: #fff !important; }
}
`;

function Documento({ l, empresa }: { l: LiquidacionGuia; empresa: EmpresaEmisor }) {
  const cli = l.clienteFactura;
  const cargosAero = CONCEPTOS_AEROLINEA.filter((k) => (l.cargosAerolinea?.[k] ?? 0) !== 0);
  const cargosAgencia = CODIGOS_AGENCIA.filter((k) => (l.cargosAgencia?.[k] ?? 0) !== 0);
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

  return (
    <div className="liq">
      <div className="cab">
        <div className="emisor">
          <div className="nombre">{empresa.nombre}</div>
          {emisorLineas.map((t) => (
            <div key={t as string}>{t}</div>
          ))}
        </div>
        <div className="titulo">
          <h1>LIQUIDACIÓN DE EMBARQUE</h1>
          <div className="sub">Shipment invoice</div>
          <div className="num">
            Coordinación N° <b>{l.numero}</b> · Emitida el <b>{formatDate(hoyIso())}</b>
          </div>
        </div>
      </div>

      {l.estado !== 'CORTADO' && (
        <div className="prov">VALORES PROVISORIOS: la guía todavía no se corta y los valores pueden cambiar.</div>
      )}

      <div className="cajas">
        <div className="caja">
          <h2>Cliente</h2>
          <div className="fuerte">{cli?.nombre ?? l.cliente?.nombre ?? '—'}</div>
          {clienteLineas.map((t) => (
            <div key={t as string}>{t}</div>
          ))}
        </div>
        <div className="caja">
          <h2>Embarque</h2>
          <div className="fila"><span>Guía aérea</span><span>{formatoAwb(l.numeroGuia)}</span></div>
          <div className="fila"><span>Fecha de vuelo</span><span>{formatDate(l.fechaVuelo)}</span></div>
          <div className="fila"><span>Aerolínea</span><span>{l.aerolinea ? nombreCorto(l.aerolinea) : '—'}</span></div>
          <div className="fila"><span>Destino</span><span>{l.destino ? [l.destino.codigo, l.destino.nombre].filter(Boolean).join(' · ') : '—'}</span></div>
          {l.marca && <div className="fila"><span>Marca</span><span>{l.marca.nombre}</span></div>}
          <div className="fila"><span>Piezas</span><span>{num(l.piezas, 0)}</span></div>
          <div className="fila"><span>Peso</span><span>{num(l.pesoBruto)} kg</span></div>
          <div className="fila"><span>Peso cobrable</span><span>{num(l.pesoCobrable)} kg</span></div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Concepto</th>
            <th>Detalle</th>
            <th className="n" style={{ width: '32mm' }}>Valor (USD)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Flete</td>
            <td>
              {num(l.pesoCobrable)} kg × {monto(l.tarifa)} por kg
            </td>
            <td className="n">{monto(l.flete)}</td>
          </tr>
          {cargosAero.length > 0 && (
            <tr className="grupo">
              <td colSpan={3}>Cargos de aerolínea</td>
            </tr>
          )}
          {cargosAero.map((k) => (
            <tr key={k}>
              <td className="sangria">{NOMBRE_CARGO_AEROLINEA[k]}</td>
              <td />
              <td className="n">{monto(l.cargosAerolinea[k])}</td>
            </tr>
          ))}
          {cargosAgencia.length > 0 && (
            <tr className="grupo">
              <td colSpan={3}>Cargos de agencia</td>
            </tr>
          )}
          {cargosAgencia.map((k) => (
            <tr key={k}>
              <td className="sangria">{textoCargoAgencia(k, l.etiquetasAgencia)}</td>
              <td />
              <td className="n">{monto(l.cargosAgencia[k])}</td>
            </tr>
          ))}
          <tr>
            <td>IVA</td>
            <td />
            <td className="n">{monto(l.iva)}</td>
          </tr>
          <tr className="subtotal">
            <td colSpan={2}>Total guía</td>
            <td className="n">{monto(l.totalGuia)}</td>
          </tr>
          <tr>
            <td>Handling</td>
            <td>Servicio de Experts</td>
            <td className="n">{monto(l.handling)}</td>
          </tr>
          <tr className="total">
            <td colSpan={2}>TOTAL A PAGAR</td>
            <td className="n">$ {monto(l.totalCobrar)}</td>
          </tr>
        </tbody>
      </table>

      <div className="nota">
        Total guía = flete + cargos de aerolínea + cargos de agencia + IVA. El handling es el servicio de Experts y se suma aparte al total de la guía.
      </div>
    </div>
  );
}

/**
 * Liquidación de una guía al cliente para imprimir (A4 vertical): datos de
 * Experts y del cliente, la guía y los renglones (flete, cargos, IVA, total de la
 * guía, handling y total a pagar). Sale de `GET /operacion/cuentas/guias/:id`.
 */
export function LiquidacionClienteImpresion({ id }: { id: number }) {
  const { liquidacion, error, isLoading } = useLiquidacionGuia(id);
  // El back puede mandar el emisor en la liquidación; si no, sale de los parámetros de la empresa.
  const empresaPedida = useEmpresaEmisor(id, !!liquidacion?.empresa);
  const empresa = liquidacion?.empresa ?? empresaPedida ?? EMPRESA_POR_DEFECTO;

  return (
    <Box className="liq-raiz" sx={{ bgcolor: '#e5e7eb', minHeight: '100vh' }}>
      <style>{CSS}</style>
      <Stack
        className="no-imprimir"
        direction="row"
        spacing={2}
        alignItems="center"
        sx={{ position: 'sticky', top: 0, zIndex: 1, bgcolor: 'background.paper', px: 3, py: 1.5, borderBottom: 1, borderColor: 'divider' }}
      >
        <Typography variant="h6" sx={{ flex: 1 }}>
          Liquidación al cliente {liquidacion ? `· guía ${formatoAwb(liquidacion.numeroGuia)}` : ''}
        </Typography>
        <Button variant="contained" startIcon={<ImprimirIcon />} disabled={!liquidacion} onClick={() => window.print()}>
          Imprimir
        </Button>
        <Button onClick={() => window.close()}>Cerrar</Button>
      </Stack>
      {error && (
        <Alert severity="error" sx={{ m: 3 }} className="no-imprimir">
          {getErrorMessage(error, 'No se pudo armar la liquidación.')}
        </Alert>
      )}
      {isLoading && <CircularProgress sx={{ m: 4 }} />}
      {liquidacion && (
        <div className="liq-hojas">
          <Documento l={liquidacion} empresa={empresa} />
        </div>
      )}
    </Box>
  );
}
