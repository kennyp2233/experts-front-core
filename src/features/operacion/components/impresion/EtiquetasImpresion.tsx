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
  /** Opcionales: un back anterior no los manda. */
  agente?: string;
  contacto?: string[];
  guias: Array<{ hawb: string; finca: string; piezas: number }>;
}

type Modo = 'caja' | 'guia';
/** Etiquetas.xlt pone arriba el embarcador y abajo la aerolínea; EtiquetasH.xlt al revés. */
type Arriba = 'embarcador' | 'aerolinea';
type Tamano = 'termica' | 'a4';

const CSS = (tamano: Tamano) => `
@page { size: ${tamano === 'termica' ? '102mm 152mm' : 'A4 portrait'}; margin: ${tamano === 'termica' ? '0' : '8mm'}; }
.et-hojas { display: flex; justify-content: center; padding: 8mm 0; }
.et-lista { display: grid; gap: 4mm; ${tamano === 'a4' ? 'grid-template-columns: repeat(2, 95mm); width: 194mm;' : 'grid-template-columns: 102mm;'} }
.et { width: ${tamano === 'termica' ? '102mm' : '95mm'}; height: ${tamano === 'termica' ? '152mm' : '135mm'}; box-sizing: border-box; background: #fff;
  color: #000; padding: 3mm; font: 9pt Arial, Helvetica, sans-serif; display: flex; flex-direction: column;
  box-shadow: 0 1px 4px rgba(0,0,0,.25); break-inside: avoid; page-break-inside: avoid; overflow: hidden; }
.et * { box-sizing: border-box; }
.et .marco { flex: 1; display: flex; flex-direction: column; border: 0.4mm solid #000; }
.et .f { flex: 1 1 auto; display: flex; border-bottom: 0.3mm solid #000; }
.et .f:last-child { border-bottom: none; }
.et .c { flex: 1; padding: 0.8mm 1.5mm; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
.et .c + .c { border-left: 0.3mm solid #000; }
.et .c.cuarto { flex: 0 0 28%; }
.et .k { font-size: 6.5pt; font-weight: 700; text-transform: uppercase; }
.et .v { font-weight: 700; text-transform: uppercase; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.et .m { font-size: 12pt; }
.et .l { font-size: 17pt; line-height: 1.05; }
.et .xl { font-size: 24pt; line-height: 1; }
.et .xxl { font-size: 32pt; line-height: 1; }
.et .envuelve { white-space: normal; line-height: 1.15; }
.et .chico { font-size: 6pt; line-height: 1.25; color: #000; }
.et .centro { text-align: center; }
@media print {
  .et { box-shadow: none; ${tamano === 'termica' ? 'break-after: page; page-break-after: always;' : ''} }
  .et-lista { gap: ${tamano === 'a4' ? '4mm' : '0'}; }
}
`;

interface UnaEtiqueta {
  hawb: string;
  finca: string;
  piezasHawb: number;
  /** "3" (una por caja) o "3-5" (una por guía hija): las piezas dentro de la guía madre. */
  pieza: string;
}

/**
 * Etiquetas de la guía como las del sistema viejo (Etiquetas.xlt / EtiquetasH.xlt,
 * con los datos de tv_Etiquetas): aerolínea y embarcador, guía madre, origen y
 * destino, guía hija con sus piezas, finca, número de pieza sobre el total de la
 * guía madre, marca y, al pie, la agencia y otra vez la guía madre. El viejo
 * sacaba una por caja. La medida se ajusta cuando tengamos el formato de la
 * impresora de EBF y FlowerCargo.
 */
export function EtiquetasImpresion({ id }: { id: number }) {
  const { data: d, error, isLoading } = useSWR<Etiquetas>(['operacion/etiquetas', id], async () =>
    (await api.get(`/operacion/coordinaciones/${id}/etiquetas`)).data,
  );
  const [modo, setModo] = useState<Modo>('caja');
  const [arriba, setArriba] = useState<Arriba>('embarcador');
  const [tamano, setTamano] = useState<Tamano>('termica');

  const etiquetas = useMemo<UnaEtiqueta[]>(() => {
    if (!d) return [];
    let desde = 1;
    return d.guias.flatMap((g) => {
      const primera = desde;
      desde += g.piezas;
      if (modo === 'guia') {
        const pieza = g.piezas > 1 ? `${primera}-${primera + g.piezas - 1}` : String(primera);
        return [{ hawb: g.hawb, finca: g.finca, piezasHawb: g.piezas, pieza }];
      }
      return Array.from({ length: g.piezas }, (_, i) => ({ hawb: g.hawb, finca: g.finca, piezasHawb: g.piezas, pieza: String(primera + i) }));
    });
  }, [d, modo]);

  return (
    <HojaImpresion
      titulo={`Etiquetas${d ? ` · guía ${d.awb} · ${etiquetas.length} ${etiquetas.length === 1 ? 'etiqueta' : 'etiquetas'}` : ''}`}
      opciones={
        <>
          <ToggleButtonGroup exclusive value={modo} onChange={(_, v: Modo | null) => v && setModo(v)} aria-label="Cuántas etiquetas">
            <ToggleButton value="caja">Una por caja</ToggleButton>
            <ToggleButton value="guia">Una por guía hija</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup exclusive value={arriba} onChange={(_, v: Arriba | null) => v && setArriba(v)} aria-label="Qué va arriba">
            <ToggleButton value="embarcador">Arriba el embarcador</ToggleButton>
            <ToggleButton value="aerolinea">Arriba la aerolínea</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup exclusive value={tamano} onChange={(_, v: Tamano | null) => v && setTamano(v)} aria-label="Tamaño">
            <ToggleButton value="termica">10 × 15 cm</ToggleButton>
            <ToggleButton value="a4">A4 (4 por hoja)</ToggleButton>
          </ToggleButtonGroup>
        </>
      }
      aviso="Diseño de la etiqueta del sistema viejo. La medida se ajusta cuando tengamos el formato de la impresora de EBF y FlowerCargo."
      listo={etiquetas.length > 0}
      error={error}
      cargando={isLoading}
      mensajeError="No se pudieron armar las etiquetas."
      css={CSS(tamano)}
      clase="et"
    >
      {d && (
        <div className="et-lista">
          {etiquetas.map((e, i) => {
            const [deArriba, deAbajo] = arriba === 'embarcador' ? [d.shipper, d.aerolinea] : [d.aerolinea, d.shipper];
            return (
              <div className="et" key={`${e.hawb}-${i}`}>
                <div className="marco">
                  <div className="f">
                    <div className="c cuarto v l centro">{d.aerolineaCodigo}</div>
                    <div className="c v m envuelve">{deArriba}</div>
                  </div>
                  <div className="f">
                    <div className="c">
                      <div className="k">Air waybill No.:</div>
                      <div className="v xl centro">{d.awb}</div>
                    </div>
                  </div>
                  <div className="f">
                    <div className="c">
                      <div className="k">Origin:</div>
                      <div className="v xxl centro">{d.origen}</div>
                    </div>
                    <div className="c">
                      <div className="k">Destination:</div>
                      <div className="v xxl centro">{d.destino}</div>
                    </div>
                  </div>
                  <div className="f">
                    <div className="c">
                      <div className="k">HAWB No.:</div>
                      <div className="v l centro">{e.hawb}</div>
                    </div>
                    <div className="c">
                      <div className="k">No. pieces HAWB:</div>
                      <div className="v l centro">{e.piezasHawb}</div>
                    </div>
                  </div>
                  <div className="f">
                    <div className="c v m envuelve">{e.finca}</div>
                  </div>
                  <div className="f">
                    <div className="c cuarto">
                      <div className="k">No. piece:</div>
                      <div className="v l centro">{e.pieza}</div>
                    </div>
                    <div className="c">
                      <div className="k">Total pieces MAWB:</div>
                      <div className="v l centro">{d.totalPiezas}</div>
                    </div>
                  </div>
                  <div className="f">
                    <div className="c">
                      <div className="k">Remarks:</div>
                      <div className="v m envuelve">{d.marca}</div>
                    </div>
                  </div>
                  <div className="f">
                    <div className="c">
                      <div className="v m envuelve">{deAbajo}</div>
                      <div className="chico">{[d.agente, ...(d.contacto ?? [])].filter(Boolean).join(' · ')}</div>
                    </div>
                  </div>
                  <div className="f">
                    <div className="c v l centro">{d.awb}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </HojaImpresion>
  );
}
