'use client';

import useSWR from 'swr';
import api from '@/shared/services/api';
import { HojaImpresion } from './BarraImpresion';

/** `GET /operacion/coordinaciones/:id/export-list` */
interface ExportList {
  titulo: string;
  agencia: string;
  agenciaRuc: string;
  aerolinea: string;
  marca: string;
  awb: string;
  fecha: string;
  filas: Array<{
    finca: string;
    hawb: string;
    sesa: string;
    dae: string;
    bxs: number;
    pcs: number;
    stems: number;
    kgs: number;
    factura: string;
    fecha: string;
    valor: number;
    ruc: string;
    direccion: string;
    producto: string;
  }>;
  totales: { bxs: number; pcs: number; stems: number; kgs: number; valor: number };
}

const nf = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
const nf2 = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CSS = `
@page { size: A4 landscape; margin: 8mm; }
.el-hojas { display: flex; justify-content: center; padding: 8mm 0; }
.el { width: 281mm; box-sizing: border-box; background: #fff; color: #000; padding: 6mm; font: 7.5pt Arial, Helvetica, sans-serif;
  box-shadow: 0 1px 4px rgba(0,0,0,.25); }
.el * { box-sizing: border-box; }
.el .cab { display: grid; grid-template-columns: 1fr 1.4fr 1fr; align-items: end; gap: 2mm; margin-bottom: 3mm; text-transform: uppercase; }
.el .cab .t { font-size: 11pt; font-weight: 700; text-align: center; }
.el .cab .b { font-weight: 700; }
.el .cab .d { text-align: right; }
.el table { width: 100%; border-collapse: collapse; }
.el thead { display: table-header-group; }
.el tr { break-inside: avoid; page-break-inside: avoid; }
.el th, .el td { border: 0.2mm solid #000; padding: 0.7mm 1mm; vertical-align: top; text-align: left; }
.el th { font-size: 6.5pt; background: #e5e7eb; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.el td { text-transform: uppercase; }
.el .n { text-align: right; white-space: nowrap; }
.el .nw { white-space: nowrap; }
.el .total td { font-weight: 700; }
@media print { .el { box-shadow: none; width: auto; padding: 0; } }
`;

/**
 * Export List de la guía, como ExportList.xlt del viejo (Coordinación ›
 * Imprimir › "Export List."): cabecera con la agencia, la aerolínea, la marca,
 * el AWB y la fecha; una fila por finca y guía hija con SESA, DAE, BXS (fulls),
 * PCS (cajas), tallos, kg, factura, fecha, valor, RUC, dirección y producto;
 * totales al pie. A4 horizontal.
 */
export function ExportListImpresion({ id }: { id: number }) {
  const { data: d, error, isLoading } = useSWR<ExportList>(['operacion/export-list', id], async () =>
    (await api.get(`/operacion/coordinaciones/${id}/export-list`)).data,
  );
  return (
    <HojaImpresion
      titulo={`Export List${d ? ` · guía ${d.awb}` : ''}`}
      listo={!!d}
      error={error}
      cargando={isLoading}
      mensajeError="No se pudo armar el Export List."
      css={CSS}
      clase="el"
    >
      {d && (
        <div className="el">
          <div className="cab">
            <div className="b">{d.agencia}</div>
            <div className="t">{d.titulo}</div>
            <div />
            <div className="b">{d.marca}</div>
            <div style={{ textAlign: 'center' }}>{d.agenciaRuc}</div>
            <div className="d">{d.aerolinea}</div>
            <div />
            <div className="b" style={{ textAlign: 'center' }}>
              AWB# {d.awb}
            </div>
            <div className="d b">FECHA: {d.fecha}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>NOMBRE</th>
                <th>HAWB</th>
                <th>CODIGO SESA</th>
                <th>DAE</th>
                <th className="n">BXS</th>
                <th className="n">PCS</th>
                <th className="n">STEMS</th>
                <th className="n">KGS</th>
                <th>FACTURA</th>
                <th>FECHA</th>
                <th className="n">VALOR</th>
                <th>RUC</th>
                <th>DIRECCION</th>
                <th>PRODUCTO</th>
              </tr>
            </thead>
            <tbody>
              {d.filas.map((f, i) => (
                <tr key={i}>
                  <td>{f.finca}</td>
                  <td className="nw">{f.hawb}</td>
                  <td className="nw">{f.sesa}</td>
                  <td className="nw">{f.dae}</td>
                  <td className="n">{nf2.format(f.bxs)}</td>
                  <td className="n">{nf.format(f.pcs)}</td>
                  <td className="n">{nf.format(f.stems)}</td>
                  <td className="n">{nf.format(f.kgs)}</td>
                  <td className="nw">{f.factura}</td>
                  <td className="nw">{f.fecha}</td>
                  <td className="n">{nf2.format(f.valor)}</td>
                  <td className="nw">{f.ruc}</td>
                  <td>{f.direccion}</td>
                  <td>{f.producto}</td>
                </tr>
              ))}
              <tr className="total">
                <td colSpan={4}>TOTAL</td>
                <td className="n">{nf2.format(d.totales.bxs)}</td>
                <td className="n">{nf.format(d.totales.pcs)}</td>
                <td className="n">{nf.format(d.totales.stems)}</td>
                <td className="n">{nf.format(d.totales.kgs)}</td>
                <td colSpan={2} />
                <td className="n">{nf2.format(d.totales.valor)}</td>
                <td colSpan={3} />
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </HojaImpresion>
  );
}
