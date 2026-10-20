'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import api from '@/shared/services/api';
import { HojaImpresion } from './BarraImpresion';

/** `GET /operacion/coordinaciones/:id/etiquetas` (los campos de tv_Etiquetas del viejo). */
interface Etiquetas {
  shipper: string;
  aerolineaCodigo: string;
  aerolinea: string;
  awb: string;
  origen: string;
  destino: string;
  marca: string;
  totalPiezas: number;
  fecha: string;
  guias: Array<{ hawb: string; finca: string; piezas: number }>;
}

type Modo = 'guia' | 'caja';
type Tamano = 'termica' | 'a4';

const CSS = (tamano: Tamano) => `
@page { size: ${tamano === 'termica' ? '102mm 152mm' : 'A4 portrait'}; margin: ${tamano === 'termica' ? '0' : '8mm'}; }
.et-hojas { display: flex; justify-content: center; padding: 8mm 0; }
.et-lista { display: grid; gap: 4mm; ${tamano === 'a4' ? 'grid-template-columns: repeat(2, 95mm); width: 194mm;' : 'grid-template-columns: 102mm;'} }
.et { width: ${tamano === 'termica' ? '102mm' : '95mm'}; height: ${tamano === 'termica' ? '152mm' : '135mm'}; box-sizing: border-box; background: #fff;
  color: #000; padding: 4mm; font: 9pt Arial, Helvetica, sans-serif; display: flex; flex-direction: column; gap: 2mm;
  border: 0.4mm solid #000; box-shadow: 0 1px 4px rgba(0,0,0,.25); break-inside: avoid; page-break-inside: avoid; overflow: hidden; }
.et * { box-sizing: border-box; }
.et .fila { display: flex; justify-content: space-between; align-items: baseline; gap: 2mm; }
.et .k { font-size: 6.5pt; text-transform: uppercase; letter-spacing: 0.3pt; }
.et .v { font-weight: 700; text-transform: uppercase; }
.et .xl { font-size: 20pt; font-weight: 700; line-height: 1.05; }
.et .xxl { font-size: 30pt; font-weight: 700; line-height: 1; }
.et .caja { border: 0.3mm solid #000; padding: 1.5mm 2mm; }
.et hr { border: 0; border-top: 0.3mm solid #000; margin: 0; }
@media print {
  .et { box-shadow: none; ${tamano === 'termica' ? 'border: none; break-after: page; page-break-after: always;' : ''} }
  .et-lista { gap: ${tamano === 'a4' ? '4mm' : '0'}; }
}
`;

interface UnaEtiqueta {
  hawb: string;
  finca: string;
  piezas: string;
}

/**
 * Etiquetas de la guía con los datos de tv_Etiquetas del viejo (shipper,
 * aerolínea, AWB, origen, destino, guía hija, finca, piezas, marca). El viejo
 * las sacaba con una plantilla de Excel que no tenemos: este diseño es
 * provisional hasta tener el formato de la impresora que usan EBF y FlowerCargo.
 */
export function EtiquetasImpresion({ id }: { id: number }) {
  const { data: d, error, isLoading } = useSWR<Etiquetas>(['operacion/etiquetas', id], async () =>
    (await api.get(`/operacion/coordinaciones/${id}/etiquetas`)).data,
  );
  const [modo, setModo] = useState<Modo>('guia');
  const [tamano, setTamano] = useState<Tamano>('termica');

  const etiquetas = useMemo<UnaEtiqueta[]>(() => {
    if (!d) return [];
    if (modo === 'guia') return d.guias.map((g) => ({ hawb: g.hawb, finca: g.finca, piezas: `${g.piezas} / ${d.totalPiezas}` }));
    return d.guias.flatMap((g) => Array.from({ length: g.piezas }, (_, i) => ({ hawb: g.hawb, finca: g.finca, piezas: `${i + 1} / ${g.piezas}` })));
  }, [d, modo]);

  return (
    <HojaImpresion
      titulo={`Etiquetas${d ? ` · guía ${d.awb} · ${etiquetas.length} ${etiquetas.length === 1 ? 'etiqueta' : 'etiquetas'}` : ''}`}
      opciones={
        <>
          <ToggleButtonGroup exclusive value={modo} onChange={(_, v: Modo | null) => v && setModo(v)} aria-label="Cuántas etiquetas">
            <ToggleButton value="guia">Una por guía hija</ToggleButton>
            <ToggleButton value="caja">Una por caja</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup exclusive value={tamano} onChange={(_, v: Tamano | null) => v && setTamano(v)} aria-label="Tamaño">
            <ToggleButton value="termica">10 × 15 cm</ToggleButton>
            <ToggleButton value="a4">A4 (4 por hoja)</ToggleButton>
          </ToggleButtonGroup>
        </>
      }
      aviso="Formato provisional: se ajusta cuando tengamos el formato de etiqueta de la impresora que usan EBF y FlowerCargo."
      listo={etiquetas.length > 0}
      error={error}
      cargando={isLoading}
      mensajeError="No se pudieron armar las etiquetas."
      css={CSS(tamano)}
      clase="et"
    >
      {d && (
        <div className="et-lista">
          {etiquetas.map((e, i) => (
            <div className="et" key={`${e.hawb}-${i}`}>
              <div className="fila">
                <span className="xl">{d.aerolinea}</span>
                <span className="xl">{d.aerolineaCodigo}</span>
              </div>
              <hr />
              <div>
                <div className="k">AWB</div>
                <div className="xxl">{d.awb}</div>
              </div>
              <div className="fila caja">
                <div>
                  <div className="k">Origin</div>
                  <div className="xl">{d.origen}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="k">Destination</div>
                  <div className="xxl">{d.destino}</div>
                </div>
              </div>
              <div className="fila">
                <div>
                  <div className="k">HAWB</div>
                  <div className="xl">{e.hawb}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="k">{modo === 'caja' ? 'Box' : 'Pieces'}</div>
                  <div className="xl">{e.piezas}</div>
                </div>
              </div>
              <hr />
              <div>
                <div className="k">Shipper (farm)</div>
                <div className="v">{e.finca}</div>
              </div>
              <div>
                <div className="k">Consignee</div>
                <div className="v">{d.marca}</div>
              </div>
              <div style={{ marginTop: 'auto' }} className="fila">
                <div>
                  <div className="k">Agent</div>
                  <div className="v">{d.shipper}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="k">Date</div>
                  <div className="v">{d.fecha}</div>
                </div>
              </div>
              <div className="k" style={{ textAlign: 'right' }}>
                Total AWB: {d.totalPiezas} pcs
              </div>
            </div>
          ))}
        </div>
      )}
    </HojaImpresion>
  );
}
