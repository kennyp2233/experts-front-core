'use client';

import useSWR from 'swr';
import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { Print as ImprimirIcon } from '@mui/icons-material';
import api from '@/shared/services/api';
import { getErrorMessage } from '@/shared/utils';

interface GuiaHijaImpresion {
  numero: string;
  finca: { nombre: string; ruc: string | null; direccion: string[]; telefono: string | null; ciudad: string | null; pais: string | null };
  dae: string | null;
  piezas: number;
  kg: number;
  fulls: number;
  productos: string[];
}

interface Impresion {
  mawb: string | null;
  fecha: string;
  empresa: { nombre: string; ruc: string; direccion: string; ciudad: string; pais: string; telefono: string };
  origen: { codigo: string; aeropuerto: string };
  destino: { codigo: string | null; aeropuerto: string | null };
  tramos: Array<{ hasta: string | null; por: string | null }>;
  aerolinea: string | null;
  pago: 'PP' | 'CC';
  consignee: string[];
  notify: string[];
  tipoEmbarque: string | null;
  manifiesto: string | null;
  guias: GuiaHijaImpresion[];
}

const nf = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

// Formulario House Air Waybill en hoja blanca (A4), medidas en mm, como el
// "Guías Hija por Finca" del sistema viejo (repCoordina2.rpt).
const CSS = `
@page { size: A4; margin: 8mm; }
.hawb-hojas { display: flex; flex-direction: column; align-items: center; gap: 8mm; padding: 8mm 0; }
.hawb { width: 194mm; height: 279mm; box-sizing: border-box; border: 0.4mm solid #000; background: #fff; color: #000;
  font: 9pt Arial, Helvetica, sans-serif; display: grid; grid-template-rows: auto; position: relative; overflow: hidden; }
.hawb * { box-sizing: border-box; }
.hawb .r { display: grid; border-bottom: 0.3mm solid #000; }
.hawb .c { border-right: 0.3mm solid #000; padding: 1mm 1.5mm; min-width: 0; overflow: hidden; }
.hawb .c:last-child { border-right: none; }
.hawb .l { font-size: 6.5pt; font-style: italic; display: block; margin-bottom: 0.6mm; }
.hawb .v { font-weight: 700; text-transform: uppercase; line-height: 1.25; white-space: pre-line; }
.hawb .grande { font-size: 15pt; font-weight: 700; }
.hawb .centro { text-align: center; }
.hawb .der { text-align: right; }
@media print {
  body * { visibility: hidden; }
  .hawb-hojas, .hawb-hojas * { visibility: visible; }
  .hawb-hojas { position: absolute; inset: 0; padding: 0; gap: 0; }
  .hawb { page-break-after: always; break-after: page; border-width: 0.3mm; }
  .no-imprimir { display: none !important; }
}
`;

function Hoja({ d, g }: { d: Impresion; g: GuiaHijaImpresion }) {
  const f = g.finca;
  const tramos = [...d.tramos, { hasta: null, por: null }, { hasta: null, por: null }, { hasta: null, por: null }].slice(0, 3);
  return (
    <div className="hawb">
      <div className="r" style={{ gridTemplateColumns: '18mm 1fr 1fr' }}>
        <div className="c v centro" style={{ fontSize: '12pt' }}>{d.origen.codigo}</div>
        <div className="c grande">{g.numero}</div>
        <div className="c grande der">{g.numero}</div>
      </div>
      <div className="r" style={{ gridTemplateColumns: '1fr 1fr', minHeight: '30mm' }}>
        <div className="c">
          <span className="l">Shipper&apos;s Name and Address</span>
          <div className="v">
            {[`${f.ruc ? `(${f.ruc}) ` : ''}${f.nombre}`, ...f.direccion, f.telefono ? `PHONE: ${f.telefono}` : null, [f.ciudad, f.pais].filter(Boolean).join(' ')]
              .filter(Boolean)
              .join('\n')}
          </div>
        </div>
        <div className="c">
          <span className="l">Not Negotiable</span>
          <div style={{ fontWeight: 700, fontStyle: 'italic' }}>AIR WAYBILL</div>
          <div style={{ fontSize: '16pt', fontWeight: 700, fontStyle: 'italic', marginTop: '3mm' }}>House Air Waybill</div>
          <div style={{ fontSize: '11pt', fontWeight: 700, fontStyle: 'italic' }}>{d.empresa.nombre}</div>
        </div>
      </div>
      <div className="r" style={{ gridTemplateColumns: '1fr 1fr', minHeight: '26mm' }}>
        <div className="c">
          <span className="l">Consignee&apos;s Name and Address</span>
          <div className="v">{d.consignee.join('\n')}</div>
        </div>
        <div className="c">
          <span className="l">It is agreed that the goods described herein are accepted in apparent good order and condition for carriage.</span>
        </div>
      </div>
      <div className="r" style={{ gridTemplateColumns: '1fr 1fr', minHeight: '26mm' }}>
        <div className="c">
          <span className="l">Issuing Carrier&apos;s Agent Name and City</span>
          <div className="v">{[d.empresa.nombre, d.empresa.ruc ? `RUC ${d.empresa.ruc}` : null, d.empresa.direccion, [d.empresa.ciudad, d.empresa.pais].filter(Boolean).join(' ')].filter(Boolean).join('\n')}</div>
        </div>
        <div className="c">
          <span className="l">Accounting Information</span>
          <div className="v">{d.notify.length ? `PLS. NOTIFY TO:\n${d.notify.join('\n')}` : ''}</div>
        </div>
      </div>
      <div className="r" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="c">
          <span className="l">Airport of Departure (Addr. of First Carrier) and Requested Routing</span>
          <div className="v">{d.origen.aeropuerto}</div>
        </div>
        <div className="c">
          <span className="l">Reference Number</span>
          <div className="v">{d.tipoEmbarque ?? ''}</div>
        </div>
      </div>
      <div className="r" style={{ gridTemplateColumns: '14mm 1fr 14mm 14mm 14mm 14mm 14mm 12mm 12mm 12mm 24mm 24mm' }}>
        <div className="c"><span className="l">To</span><div className="v">{tramos[0].hasta ?? ''}</div></div>
        <div className="c"><span className="l">By First Carrier</span><div className="v">{d.aerolinea ?? tramos[0].por ?? ''}</div></div>
        <div className="c"><span className="l">To</span><div className="v">{tramos[1].hasta ?? ''}</div></div>
        <div className="c"><span className="l">By</span><div className="v">{tramos[1].por ?? ''}</div></div>
        <div className="c"><span className="l">To</span><div className="v">{tramos[2].hasta ?? ''}</div></div>
        <div className="c"><span className="l">By</span><div className="v">{tramos[2].por ?? ''}</div></div>
        <div className="c"><span className="l">Currency</span><div className="v">USD</div></div>
        <div className="c"><span className="l">CHGS</span><div className="v">{d.pago}</div></div>
        <div className="c"><span className="l">WT/VAL</span><div className="v">{d.pago}</div></div>
        <div className="c"><span className="l">Other</span><div className="v">{d.pago}</div></div>
        <div className="c"><span className="l">Declared Value for Carriage</span><div className="v">NVD</div></div>
        <div className="c"><span className="l">Declared Value for Customs</span><div className="v">NVC</div></div>
      </div>
      <div className="r" style={{ gridTemplateColumns: '1fr 1fr 40mm' }}>
        <div className="c"><span className="l">Airport of Destination</span><div className="v">{d.destino.aeropuerto ?? d.destino.codigo ?? ''}</div></div>
        <div className="c"><span className="l">Requested Flight / Date</span><div className="v">{d.fecha}</div></div>
        <div className="c"><span className="l">Amount of Insurance</span><div className="v">NIL</div></div>
      </div>
      <div className="r" style={{ gridTemplateColumns: '1fr', minHeight: '30mm' }}>
        <div className="c">
          <span className="l">Handling Information</span>
          <div className="v" style={{ fontWeight: 400 }}>
            {[
              `MAWB: ${d.mawb ?? ''}`,
              `HAWB: ${g.numero}`,
              `DAE: ${g.dae ?? ''}`,
              `FULL BXS: ${nf.format(g.fulls)}`,
              d.manifiesto ? `MANIFIESTO: ${d.manifiesto}` : null,
            ]
              .filter(Boolean)
              .join('\n')}
          </div>
        </div>
      </div>
      <div className="r" style={{ gridTemplateColumns: '16mm 22mm 8mm 16mm 22mm 20mm 28mm 1fr' }}>
        {['No. of Pieces', 'Gross Weight', 'kg lb', 'Rate Class', 'Chargeable Weight', 'Rate / Charge', 'Total', 'Nature and Quantity of Goods'].map((t) => (
          <div key={t} className="c centro"><span className="l">{t}</span></div>
        ))}
      </div>
      <div className="r" style={{ gridTemplateColumns: '16mm 22mm 8mm 16mm 22mm 20mm 28mm 1fr', minHeight: '44mm' }}>
        <div className="c v centro">{g.piezas}</div>
        <div className="c v centro">{nf.format(g.kg)}</div>
        <div className="c v centro">K</div>
        <div className="c" />
        <div className="c" />
        <div className="c" />
        <div className="c v centro">AS AGREED</div>
        <div className="c v centro">{[...g.productos, 'FRESH FLOWERS', 'PERISHABLES', 'ATTACHED DOCUMENTS', g.finca.nombre].join('\n')}</div>
      </div>
      <div className="r" style={{ gridTemplateColumns: '50mm 1fr' }}>
        <div className="c"><span className="l">Prepaid · Weight Charge · Collect</span><div className="v">{d.pago === 'PP' ? 'AS AGREED · PREPAID' : 'AS AGREED · COLLECT'}</div></div>
        <div className="c"><span className="l">Other Charges</span><div className="v">AS AGREED</div></div>
      </div>
      <div className="r" style={{ gridTemplateColumns: '50mm 1fr', minHeight: '20mm' }}>
        <div className="c"><span className="l">Total Prepaid · Total Collect</span><div className="v">AS AGREED</div></div>
        <div className="c" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <span className="l">Signature of Shipper or his Agent</span>
        </div>
      </div>
      <div className="r" style={{ gridTemplateColumns: '1fr 1fr 1.3fr', borderBottom: 'none' }}>
        <div className="c"><div className="v">{d.fecha}</div><span className="l">Executed on (date)</span></div>
        <div className="c"><div className="v">{[d.empresa.ciudad === 'RUMINAHUI' ? 'QUITO' : d.empresa.ciudad, d.empresa.pais].filter(Boolean).join(' ')}</div><span className="l">at (place)</span></div>
        <div className="c"><div className="v">{d.empresa.nombre}</div><span className="l">Signature of Issuing Carrier or its Agent</span></div>
      </div>
      <div className="grande" style={{ position: 'absolute', right: '3mm', bottom: '1mm', fontSize: '12pt' }}>{g.numero}</div>
    </div>
  );
}

/**
 * Guías hijas por finca para imprimir (una House Air Waybill por guía hija,
 * hoja blanca A4): todas las de la coordinación o, con `guiaHija`, una sola.
 */
export function GuiasHijasImpresion({ id, guiaHija }: { id: number; guiaHija?: number }) {
  const { data, error, isLoading } = useSWR<Impresion>(['operacion/impresion-hijas', id, guiaHija], async () =>
    (await api.get(`/operacion/coordinaciones/${id}/guias-hijas/impresion`, { params: guiaHija ? { guiaHija } : {} })).data,
  );

  return (
    <Box sx={{ bgcolor: '#e5e7eb', minHeight: '100vh' }}>
      <style>{CSS}</style>
      <Stack
        className="no-imprimir"
        direction="row"
        spacing={2}
        alignItems="center"
        sx={{ position: 'sticky', top: 0, zIndex: 1, bgcolor: 'background.paper', px: 3, py: 1.5, borderBottom: 1, borderColor: 'divider' }}
      >
        <Typography variant="h6" sx={{ flex: 1 }}>
          Guías hijas {data ? `· ${data.guias.length} ${data.guias.length === 1 ? 'hoja' : 'hojas'} · guía ${data.mawb ?? ''}` : ''}
        </Typography>
        <Button variant="contained" startIcon={<ImprimirIcon />} disabled={!data} onClick={() => window.print()}>
          Imprimir
        </Button>
        <Button onClick={() => window.close()}>Cerrar</Button>
      </Stack>
      {error && (
        <Alert severity="error" sx={{ m: 3 }}>
          {getErrorMessage(error, 'No se pudieron armar las guías hijas.')}
        </Alert>
      )}
      {isLoading && <CircularProgress sx={{ m: 4 }} />}
      {data && (
        <div className="hawb-hojas">
          {data.guias.map((g) => (
            <Hoja key={g.numero} d={data} g={g} />
          ))}
        </div>
      )}
    </Box>
  );
}
