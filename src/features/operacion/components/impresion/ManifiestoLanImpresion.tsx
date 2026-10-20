'use client';

/**
 * Manifiesto "Formato Aerolínea" de LAN: la hoja de `FormatoLAN.xlt` que el viejo llenaba en
 * `frmPIN_Coordina.Proc_712330` (botón "Formato Aerolínea"). Se usa cuando `PIN_auxAerolineas.aerPlantilla` termina
 * en `||FormatoLAN` (hoy LAN CARGO y LATAM); para las demás el viejo usa `ResumenGuiasHija.xlt`, que es la misma
 * tabla con las 9 columnas a la vista (acá: "Con datos").
 *
 * Hoja1 de la plantilla (A4 vertical, escala 97 %):
 *   A1:I1  "CONSOLIDATED CARGO MANIFEST" (Arial 14 negrita, centrado)
 *   E3 / G3  "Destino: <destino>" / "Despacho: <fecha>"   (en la plantilla E3=F3 y G3=H3; F y H están ocultas)
 *   fila 5 (encabezado, fondo celeste, negrita, borde fino):
 *     AWB No. | PCS | KGS | SHIPPER MASTER | SHIPPER HOUSE | [SHIPPER'S DATA, oculta] | CONSIGNEE |
 *     [CONSIGNEE'S DATA, oculta] | DESCRIPTION CODE
 *   fila 6  la guía madre: AWB, suma de PCS y de KGS (=SUM(B7:Bn)), shipper master, "CONSOLIDATION", datos del
 *           shipper (oculta), consignee de la guía y sus datos (oculta), "Fresh Cut Flowers"
 *   filas 7..n  una por guía hija (detFULL > 0): HAWB, cajas, kilos, [vacío], finca + RUC, [dirección, PHONE,
 *           ciudad y país de la finca: oculta], consignee de la hija, [sus datos: oculta], producto (proRefer)
 *   A6:In con borde fino; filas con alto automático.
 */

/** Lo que usa el formato de `GET /operacion/coordinaciones/:id/guias-hijas/impresion`. */
export interface DatosManifiestoLan {
  mawb: string | null;
  fecha: string;
  destino: { codigo: string | null; aeropuerto: string | null };
  consignee: string[];
  consigneeMaster?: string[];
  guias: Array<{
    numero: string;
    finca: { nombre: string; ruc: string | null; direccion?: string[]; telefono?: string | null; ciudad?: string | null; pais?: string | null };
    consignee?: string[];
    piezas: number;
    kg: number;
    fulls: number;
    productos: string[];
  }>;
}

/** Medidas de columna de `FormatoLAN.xlt` (mm): A..I; F y H van ocultas salvo "Con datos". */
const COLUMNAS = [
  { k: 'awb', titulo: 'AWB No.', w: 23.5 },
  { k: 'pcs', titulo: 'PCS', w: 11.6 },
  { k: 'kgs', titulo: 'KGS', w: 11.6 },
  { k: 'master', titulo: 'SHIPPER MASTER', w: 19.6 },
  { k: 'house', titulo: 'SHIPPER HOUSE', w: 54.8 },
  { k: 'datosShipper', titulo: "SHIPPER'S DATA", w: 42.9, oculta: true },
  { k: 'consignee', titulo: 'CONSIGNEE', w: 46.8 },
  { k: 'datosConsignee', titulo: "CONSIGNEE'S DATA", w: 38.9, oculta: true },
  { k: 'descripcion', titulo: 'DESCRIPTION CODE', w: 27.8 },
] as const;

/** "General" de Excel: sin separador de miles, hasta 2 decimales. */
const general = (n: number) => String(Math.round(n * 100) / 100);

export const CSS_MANIFIESTO_LAN = `
.man-lan { background: #fff; color: #000; font: 9pt Arial, Helvetica, sans-serif; box-sizing: border-box; padding: 4mm 0;
  box-shadow: 0 1px 4px rgba(0,0,0,.25); }
.man-lan * { box-sizing: border-box; }
.man-lan h1 { font-size: 14pt; text-align: center; margin: 0; line-height: 1.3; }
.man-lan .sub { display: flex; margin: 3mm 0 4mm; font-size: 9pt; }
.man-lan table { border-collapse: collapse; table-layout: fixed; }
.man-lan thead { display: table-header-group; }
.man-lan tr { break-inside: avoid; page-break-inside: avoid; }
.man-lan th { background: #00ccff; font-weight: 700; text-align: center; vertical-align: middle; height: 11mm;
  -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.man-lan th, .man-lan td { border: 0.25mm solid #000; padding: 0.4mm 0.8mm; }
.man-lan td { vertical-align: top; text-align: left; white-space: pre-line; overflow-wrap: anywhere; }
.man-lan td.n { text-align: right; white-space: nowrap; }
@media print {
  .man-lan { box-shadow: none; padding: 0; }
}
`;

function Fila({ celdas, visibles }: { celdas: string[]; visibles: boolean[] }) {
  return (
    <tr>
      {celdas.map((t, i) =>
        visibles[i] ? (
          <td key={COLUMNAS[i].k} className={i === 1 || i === 2 ? 'n' : undefined}>
            {t}
          </td>
        ) : null,
      )}
    </tr>
  );
}

/** Hoja del manifiesto "Formato LAN". `shipper` son los renglones del shipper de la guía madre (nombre, RUC, dirección, PHONE, ciudad/país). */
export function ManifiestoLan({ d, shipper, conDatos }: { d: DatosManifiestoLan; shipper: string[] | null; conDatos: boolean }) {
  // El viejo solo lista las líneas con fulls (detFULL > 0).
  const conFulls = d.guias.filter((g) => g.fulls > 0);
  const guias = conFulls.length ? conFulls : d.guias;
  const totPcs = guias.reduce((s, g) => s + g.piezas, 0);
  const totKgs = guias.reduce((s, g) => s + g.kg, 0);
  const visibles = COLUMNAS.map((c) => !('oculta' in c) || conDatos);
  const ancho = COLUMNAS.reduce((s, c, i) => s + (visibles[i] ? c.w : 0), 0);

  const master = d.consigneeMaster?.length ? d.consigneeMaster : d.consignee;
  const destino = d.destino.aeropuerto ?? d.destino.codigo ?? '';
  const filaMadre = [
    d.mawb ?? '',
    general(totPcs),
    general(totKgs),
    shipper?.[0] ?? '',
    'CONSOLIDATION',
    (shipper ?? []).slice(2).filter(Boolean).join('\n'),
    master[0] ?? '',
    master.slice(1).join('\n'),
    'Fresh Cut Flowers',
  ];

  return (
    <div className="man-lan" style={{ width: `${ancho}mm` }}>
      <h1>CONSOLIDATED CARGO MANIFEST</h1>
      <div className="sub">
        <span style={{ width: `${COLUMNAS.slice(0, 4).reduce((s, c) => s + c.w, 0)}mm` }} />
        <span style={{ width: `${COLUMNAS[4].w + (visibles[5] ? COLUMNAS[5].w : 0)}mm` }}>Destino: {destino}</span>
        <span>Despacho: {d.fecha}</span>
      </div>
      <table style={{ width: `${ancho}mm` }}>
        <colgroup>
          {COLUMNAS.map((c, i) => (visibles[i] ? <col key={c.k} style={{ width: `${c.w}mm` }} /> : null))}
        </colgroup>
        <thead>
          <tr>
            {COLUMNAS.map((c, i) => (visibles[i] ? <th key={c.k}>{c.titulo}</th> : null))}
          </tr>
        </thead>
        <tbody>
          <Fila celdas={filaMadre} visibles={visibles} />
          {guias.map((g) => {
            const consignee = g.consignee?.length ? g.consignee : d.consignee;
            const f = g.finca;
            return (
              <Fila
                key={g.numero}
                visibles={visibles}
                celdas={[
                  g.numero,
                  general(g.piezas),
                  general(g.kg),
                  '',
                  [f.nombre, f.ruc ? `RUC: ${f.ruc}` : ''].filter(Boolean).join('\n'),
                  [...(f.direccion ?? []), f.telefono ? `PHONE: ${f.telefono}` : '', [f.ciudad, f.pais].filter(Boolean).join(' ')]
                    .filter(Boolean)
                    .join('\n'),
                  consignee[0] ?? '',
                  consignee.slice(1).join('\n'),
                  g.productos.join(', '),
                ]}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
