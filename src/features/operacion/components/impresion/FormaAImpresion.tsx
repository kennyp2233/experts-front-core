'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import api from '@/shared/services/api';
import { HojaImpresion } from './BarraImpresion';

type Exportador = 'cliente' | 'agencia';
type Cantidad = 'piezas' | 'fulls';
type Descripcion = 'general' | 'producto';

/** `GET /operacion/coordinaciones/:id/forma-a` */
interface FormaA {
  exportador: { lineas: string[]; tipo: Exportador };
  consignatario: string[];
  aerolinea: string;
  ruta: string;
  awb: string;
  cantidad: number;
  unidad: 'PCS' | 'BXS';
  descripcion: string;
  productos: Array<{ descripcion: string; kg: number }>;
  criterio: string;
  kgs: number;
  fecha: string;
  paisImportador: string;
  certificado: string | null;
  lugar: string;
}

const nf = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

// Papel Legal vertical (PaperSize = 5 en repFormaA.xlt).
const CSS = `
@page { size: 216mm 356mm; margin: 8mm; }
.fa-hojas { display: flex; justify-content: center; padding: 8mm 0; }
.fa { width: 200mm; min-height: 340mm; box-sizing: border-box; background: #fff; color: #000; padding: 5mm;
  font: 8pt Arial, Helvetica, sans-serif; box-shadow: 0 1px 4px rgba(0,0,0,.25); display: grid;
  grid-template-rows: auto 1fr auto; border: 0.4mm solid #000; }
.fa * { box-sizing: border-box; }
.fa .arriba { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 0.4mm solid #000; }
.fa .col { display: flex; flex-direction: column; }
.fa .col + .col { border-left: 0.4mm solid #000; }
.fa .caja { padding: 1.5mm 2mm; border-bottom: 0.3mm solid #000; min-height: 30mm; }
.fa .caja:last-child { border-bottom: none; }
.fa .rot { font-size: 6.5pt; font-style: italic; margin-bottom: 1.5mm; }
.fa .dato { font-weight: 700; text-transform: uppercase; white-space: pre-line; font-size: 8.5pt; }
.fa .titulo { text-align: center; padding: 3mm 2mm; border-bottom: 0.3mm solid #000; }
.fa .titulo .t1 { font-size: 10pt; font-weight: 700; letter-spacing: 0.3pt; }
.fa .titulo .t2 { font-size: 13pt; font-weight: 700; margin-top: 1mm; }
.fa .titulo .t3 { font-size: 7.5pt; margin-top: 1mm; }
.fa table { width: 100%; border-collapse: collapse; }
.fa th { font-size: 6.5pt; font-weight: 400; font-style: italic; text-align: left; vertical-align: top; padding: 1.5mm 2mm;
  border-bottom: 0.3mm solid #000; border-right: 0.3mm solid #000; }
.fa td { vertical-align: top; padding: 2mm; border-right: 0.3mm solid #000; font-weight: 700; text-transform: uppercase; }
.fa th:last-child, .fa td:last-child { border-right: none; }
.fa .n { text-align: right; white-space: nowrap; }
.fa .abajo { display: grid; grid-template-columns: 1fr 1fr; border-top: 0.4mm solid #000; }
.fa .abajo > div { padding: 2mm; min-height: 62mm; display: flex; flex-direction: column; gap: 2mm; }
.fa .abajo > div + div { border-left: 0.4mm solid #000; }
.fa .texto { font-size: 7pt; line-height: 1.35; }
.fa .linea { margin-top: auto; border-top: 0.2mm solid #000; padding-top: 1mm; font-size: 6.5pt; text-align: center; }
.fa .lugar { font-weight: 700; text-align: center; }
@media print { .fa { box-shadow: none; } }
`;

/**
 * Form A (certificado de origen GSP) en hoja blanca, como repFormaA.xlt del
 * viejo (Coordinación › Imprimir › "Forma A"): exportador, consignatario
 * (marFormaA), transporte y ruta, la carga ("FRESH CUT FLOWERS" o por producto),
 * criterio de origen, peso, fecha y país importador. Hoy lo emiten EBF y
 * FlowerCargo por ECUAPASS: queda por si hace falta.
 */
export function FormaAImpresion({ id }: { id: number }) {
  const [exportador, setExportador] = useState<Exportador>('cliente');
  const [cantidad, setCantidad] = useState<Cantidad | null>(null);
  const [descripcion, setDescripcion] = useState<Descripcion>('general');
  const { data: d, error, isLoading } = useSWR<FormaA>(['operacion/forma-a', id, exportador, cantidad], async () =>
    (
      await api.get(`/operacion/coordinaciones/${id}/forma-a`, {
        params: { exportador, ...(cantidad ? { cantidad } : {}) },
      })
    ).data,
  );
  const unidad = d?.unidad === 'BXS' ? 'fulls' : 'piezas';

  return (
    <HojaImpresion
      titulo={`Form A${d ? ` · guía ${d.awb}` : ''}`}
      opciones={
        <>
          <ToggleButtonGroup exclusive value={exportador} onChange={(_, v: Exportador | null) => v && setExportador(v)} aria-label="Exportador">
            <ToggleButton value="cliente">Exportador: cliente</ToggleButton>
            <ToggleButton value="agencia">Agencia</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup exclusive value={cantidad ?? unidad} onChange={(_, v: Cantidad | null) => v && setCantidad(v)} aria-label="Cantidad">
            <ToggleButton value="piezas">Piezas (PCS)</ToggleButton>
            <ToggleButton value="fulls">Fulls (BXS)</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup exclusive value={descripcion} onChange={(_, v: Descripcion | null) => v && setDescripcion(v)} aria-label="Descripción">
            <ToggleButton value="general">Fresh cut flowers</ToggleButton>
            <ToggleButton value="producto">Por producto</ToggleButton>
          </ToggleButtonGroup>
        </>
      }
      listo={!!d}
      error={error}
      cargando={isLoading && !d}
      mensajeError="No se pudo armar el Form A."
      css={CSS}
      clase="fa"
    >
      {d && (
        <div className="fa">
          <div className="arriba">
            <div className="col">
              <div className="caja">
                <div className="rot">1. Goods consigned from (Exporter&apos;s business name, address, country)</div>
                <div className="dato">{d.exportador.lineas.join('\n')}</div>
              </div>
              <div className="caja">
                <div className="rot">2. Goods consigned to (Consignee&apos;s name, address, country)</div>
                <div className="dato">{d.consignatario.join('\n')}</div>
              </div>
              <div className="caja">
                <div className="rot">3. Means of transport and route (as far as known)</div>
                <div className="dato">
                  {`AIRWAY: ${d.aerolinea}\nROUTE: ${d.ruta}\nAWB: ${d.awb}`}
                </div>
              </div>
            </div>
            <div className="col">
              <div className="caja" style={{ minHeight: 0 }}>
                <div className="rot">Reference No.</div>
                <div className="dato">{d.certificado ?? ''}</div>
              </div>
              <div className="titulo">
                <div className="t1">GENERALIZED SYSTEM OF PREFERENCES</div>
                <div className="t1">CERTIFICATE OF ORIGIN</div>
                <div className="t3">(Combined declaration and certificate)</div>
                <div className="t2">FORM A</div>
                <div className="t3" style={{ marginTop: '3mm' }}>
                  Issued in <strong>ECUADOR</strong> (country)
                </div>
              </div>
              <div className="caja" style={{ flex: 1 }}>
                <div className="rot">4. For official use</div>
              </div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style={{ width: '12mm' }}>5. Item number</th>
                <th style={{ width: '30mm' }}>6. Marks and numbers of packages</th>
                <th>7. Number and kind of packages; description of goods</th>
                <th style={{ width: '20mm' }}>8. Origin criterion</th>
                <th style={{ width: '26mm' }}>9. Gross weight or other quantity</th>
                <th style={{ width: '28mm' }}>10. Number and date of invoices</th>
              </tr>
            </thead>
            <tbody>
              {descripcion === 'producto' && d.productos.length > 0 ? (
                d.productos.map((p, i) => (
                  <tr key={p.descripcion}>
                    <td>{i + 1}</td>
                    <td>{i === 0 ? `${nf.format(d.cantidad)} ${d.unidad}` : ''}</td>
                    <td>{p.descripcion}</td>
                    <td>{d.criterio}</td>
                    <td className="n">{nf.format(p.kg)} KLS</td>
                    <td>{i === 0 ? d.fecha : ''}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td>1</td>
                  <td>
                    {nf.format(d.cantidad)} {d.unidad}
                  </td>
                  <td>{d.descripcion}</td>
                  <td>{d.criterio}</td>
                  <td className="n">{nf.format(d.kgs)} KLS</td>
                  <td>{d.fecha}</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="abajo">
            <div>
              <div className="rot">11. Certification</div>
              <div className="texto">
                It is hereby certified, on the basis of control carried out, that the declaration by the exporter is correct.
              </div>
              <div className="lugar" style={{ marginTop: 'auto' }}>
                {d.lugar} · {d.fecha}
              </div>
              <div className="linea">Place and date, signature and stamp of certifying authority</div>
            </div>
            <div>
              <div className="rot">12. Declaration by the exporter</div>
              <div className="texto">
                The undersigned hereby declares that the above details and statements are correct; that all the goods were produced
                in <strong>ECUADOR</strong> (country) and that they comply with the origin requirements specified for those goods in
                the Generalized System of Preferences for goods exported to <strong>{d.paisImportador || '…'}</strong> (importing
                country).
              </div>
              <div className="lugar" style={{ marginTop: 'auto' }}>
                {d.lugar} · {d.fecha}
              </div>
              <div className="linea">Place and date, signature of authorized signatory</div>
            </div>
          </div>
        </div>
      )}
    </HojaImpresion>
  );
}
