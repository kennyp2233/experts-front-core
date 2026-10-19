'use client';

import { useMemo, useState, type ChangeEvent, type CSSProperties, type ReactNode } from 'react';
import useSWR from 'swr';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { Print as ImprimirIcon } from '@mui/icons-material';
import api from '@/shared/services/api';
import { getErrorMessage } from '@/shared/utils';
import {
  CELDAS_AGENCIA,
  CELDAS_FINCAS,
  CUADRO_AEROLINEA,
  FILA_CARGO,
  FILAS_CARGO_LIBRES,
  GEOMETRIA_BASE,
  GEOMETRIA_TURKISH,
  type CeldaGeometria,
} from './geometriaGuiaMadre';

type Valores = 'aerolinea' | 'cliente';
type Formato = 'blanca' | 'papel';
type Papel = 'carta' | 'oficio' | 'a4';

/** Respuesta de `GET /operacion/coordinaciones/:id/guia-madre/impresion` (ya formateada en el back). */
interface ImpresionGuiaMadre {
  numero: string;
  prefijo: string;
  resto: string;
  estado: 'BORRADOR' | 'CORTADO' | 'ANULADO';
  valores: Valores;
  hayCobroCliente: boolean;
  aerolinea: {
    nombre: string;
    ruc: string | null;
    direccion: string[];
    alias: string | null;
    codigo: string | null;
    plantilla: string | null;
    virtual: boolean;
  };
  shipper: string[];
  consignee: string[];
  notify: string[];
  agente: { lineas: string[]; iata: string | null };
  origen: { codigo: string; aeropuerto: string };
  destino: { codigo: string | null; aeropuerto: string | null };
  tramos: Array<{ hasta: string | null; por: string | null }>;
  primerTransportista: string | null;
  ruta: string;
  vuelo: string | null;
  pago: 'PP' | 'CC';
  piezas: number;
  kg: number;
  fulls: number;
  pesoCobrable: number | null;
  tarifa: number | null;
  flete: number | null;
  naturaleza: string[];
  marca: string | null;
  fincas: Array<{ texto: string; nombre: string; fulls: number }>;
  cargosAerolinea: Array<{ tipo: string; codigo: string; valor: number }>;
  iva: { codigo: string; valor: number };
  handling: number;
  cargosAgencia: Array<{ codigo: string; valor: number }>;
  totales: { flete: number | null; dueCarrier: number; dueAgent: number; iva: number; total: number | null };
  fecha: string;
  lugar: string;
  empresa: { nombre: string; ruc: string };
  manifiesto: string | null;
}

/** Ajustes de impresión de una aerolínea (papel, corrimiento, firma), guardados en este navegador. */
interface Perfil {
  papel: Papel;
  dx: number;
  dy: number;
  firma: string;
  cuadro: boolean;
}

interface Opciones {
  fincas: boolean;
  codigos: boolean;
  firma: string;
}

const PAPELES: Record<Papel, { nombre: string; w: number; h: number }> = {
  carta: { nombre: 'Carta (216 × 279)', w: 215.9, h: 279.4 },
  oficio: { nombre: 'Oficio (216 × 330)', w: 215.9, h: 330.2 },
  a4: { nombre: 'A4 (210 × 297)', w: 210, h: 297 },
};

// ---------------------------------------------------------------- formato de números

const dinero = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
/** Montos como el viejo: "2,808.72". */
const monto = (n: number | null | undefined) => (n === null || n === undefined ? '' : dinero.format(n));
/** Formato "General" de Excel: sin separador de miles, hasta 2 decimales ("1015", "1015.5"). */
const general = (n: number | null | undefined) => (n === null || n === undefined ? '' : String(Math.round(n * 100) / 100));
const tarifa = (n: number | null | undefined) => (n === null || n === undefined ? '' : n.toFixed(2));
/** Fulls totales como los concatena el viejo ("26", "26,5"). */
const fullsTotal = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace('.', ',').replace(/0$/, ''));

// ---------------------------------------------------------------- perfil por aerolínea (localStorage)

const esTurkish = (d: ImpresionGuiaMadre) => /turkish/i.test(d.aerolinea.plantilla ?? '');
const clavePerfil = (d: ImpresionGuiaMadre) =>
  `experts.impresion.guiaMadre.${(d.aerolinea.plantilla || d.aerolinea.nombre || 'general').trim().toUpperCase()}`;

function perfilDefecto(d: ImpresionGuiaMadre): Perfil {
  const plantilla = d.aerolinea.plantilla ?? '';
  return {
    // GMTurkishVirtual está en oficio; las demás en el papel de la impresora (carta/continuo).
    papel: esTurkish(d) ? 'oficio' : 'carta',
    dx: 0,
    dy: 0,
    // Firma que traen las plantillas del viejo (preguntar al dueño quién firma hoy).
    firma: /turkish|lan/i.test(plantilla) ? 'JAVIER BUSTOS' : 'MAURICIO PINCHAO',
    // Solo las plantillas "Virtual" (guía neutra) imprimen el cuadro con la aerolínea.
    cuadro: /virtual/i.test(plantilla),
  };
}

function leerPerfil(clave: string, defecto: Perfil): Perfil {
  try {
    const guardado = window.localStorage.getItem(clave);
    if (!guardado) return defecto;
    const p = JSON.parse(guardado) as Partial<Perfil>;
    return {
      papel: p.papel && p.papel in PAPELES ? p.papel : defecto.papel,
      dx: typeof p.dx === 'number' && Number.isFinite(p.dx) ? p.dx : defecto.dx,
      dy: typeof p.dy === 'number' && Number.isFinite(p.dy) ? p.dy : defecto.dy,
      firma: typeof p.firma === 'string' ? p.firma : defecto.firma,
      cuadro: typeof p.cuadro === 'boolean' ? p.cuadro : defecto.cuadro,
    };
  } catch {
    return defecto;
  }
}

function guardarPerfil(clave: string, p: Perfil) {
  try {
    window.localStorage.setItem(clave, JSON.stringify(p));
  } catch {
    // Sin almacenamiento (modo privado, bloqueado): el ajuste vale solo para esta pestaña.
  }
}

// ---------------------------------------------------------------- papel de guía (solo datos, posiciones del viejo)

/**
 * Totales que se imprimen. Como el viejo, por defecto la guía madre no lleva los
 * cargos de la agencia (total = flete + cargos de la aerolínea + IVA); con
 * "Códigos de agencia" van los códigos, su suma ("due agent") y el total con ellos.
 */
function totalesImpresos(d: ImpresionGuiaMadre, op: Opciones): ImpresionGuiaMadre['totales'] {
  const t = d.totales;
  if (op.codigos) return t;
  return { ...t, dueAgent: 0, total: t.total === null ? null : Math.round((t.total - t.dueAgent) * 100) / 100 };
}

/**
 * Texto de cada celda de la Hoja1 de la plantilla GM*.xlt, con la misma
 * lógica de sus fórmulas (Hoja2/Hoja3 del viejo).
 */
function celdasPapel(d: ImpresionGuiaMadre, op: Opciones): Record<string, string> {
  const pp = d.pago === 'PP';
  const t = totalesImpresos(d, op);
  const tramo = (i: number) => d.tramos[i] ?? { hasta: null, por: null };
  const c: Record<string, string> = {
    B3: d.prefijo,
    C3: d.origen.codigo,
    D3: d.resto,
    I3: 'RUC #',
    K3: d.aerolinea.ruc ?? '',
    O3: d.numero,
    B27: d.agente.iata ?? '',
    B29: d.origen.aeropuerto,
    G29: d.ruta,
    B31: tramo(0).hasta ?? '',
    C31: d.primerTransportista ?? '',
    G31: [tramo(1).hasta, tramo(1).por, tramo(2).hasta, tramo(2).por].filter(Boolean).join(' '),
    J31: 'USD',
    K31: d.pago,
    L31: d.pago,
    M31: d.pago,
    O31: 'NVD',
    R31: 'NVC',
    B33: d.destino.aeropuerto ?? d.destino.codigo ?? '',
    K33: 'NIL',
    O44: 'FYT',
    B45: general(d.piezas),
    C45: general(d.kg),
    D45: 'Kg',
    G45: general(d.pesoCobrable),
    I45: tarifa(d.tarifa),
    K45: monto(d.flete),
    O45: 'CONSOLIDATED',
    O46: d.naturaleza[0] ?? '',
    O54: `TOTAL IN FULL:  ${fullsTotal(d.fulls)}`,
    B55: general(d.piezas),
    C55: general(d.kg),
    D55: 'Kg',
    K55: monto(d.flete),
    // Weight charge: el monto en la columna del pago y el texto en la otra (B57/F57).
    B57: pp ? monto(t.flete) : 'COLLECT',
    F57: pp ? 'PREPAID' : monto(t.flete),
    // IVA (J63/K63) y "Tax" prepagado (B60 = K63).
    J63: t.iva ? d.iva.codigo : '',
    K63: pp && t.iva ? monto(t.iva) : '',
    B60: pp && t.iva ? monto(t.iva) : '',
    // Total other charges due agent (B62/F62): solo con "Códigos de agencia" (ver totalesImpresos).
    B62: pp && t.dueAgent ? monto(t.dueAgent) : '',
    F62: !pp && t.dueAgent ? monto(t.dueAgent) : '',
    // Total other charges due carrier (B64/F64) y total (B68/F68).
    B64: pp ? monto(t.dueCarrier) : '',
    F64: pp ? '' : monto(t.dueCarrier),
    M64: d.agente.lineas[0] ?? '',
    I65: [d.empresa.nombre, d.empresa.ruc ? `RUC ${d.empresa.ruc}` : ''].filter(Boolean).join(' '),
    B68: pp ? monto(t.total) : 'COLLECT',
    F68: pp ? 'PREPAID' : monto(t.total),
    N68: d.empresa.nombre,
    I69: d.fecha,
    M69: d.lugar,
    P69: op.firma.toUpperCase(),
    P70: d.numero,
  };
  ['B7', 'B8', 'B9', 'B10', 'B11'].forEach((k, i) => (c[k] = d.shipper[i] ?? ''));
  ['B17', 'B18', 'B19', 'B20', 'B21'].forEach((k, i) => (c[k] = d.consignee[i] ?? ''));
  ['B23', 'B24', 'B25'].forEach((k, i) => (c[k] = d.agente.lineas[i] ?? ''));
  if (d.notify.length) {
    c.K23 = 'PLS NOTIFY TO:';
    ['N23', 'N24', 'N25', 'N26', 'N27'].forEach((k, i) => (c[k] = d.notify[i] ?? ''));
  }

  // Cargos de aerolínea: cada tipo en su fila (J rótulo, K valor); AUX2 en la primera libre.
  const usadas = new Set<number>();
  const pendientes: ImpresionGuiaMadre['cargosAerolinea'] = [];
  for (const x of d.cargosAerolinea) {
    const fila = FILA_CARGO[x.tipo];
    if (fila && !usadas.has(fila)) {
      usadas.add(fila);
      c[`J${fila}`] = x.codigo;
      c[`K${fila}`] = monto(x.valor);
    } else pendientes.push(x);
  }
  for (const x of pendientes) {
    const fila = FILAS_CARGO_LIBRES.find((f) => !usadas.has(f));
    if (!fila) break;
    usadas.add(fila);
    c[`J${fila}`] = x.codigo;
    c[`K${fila}`] = monto(x.valor);
  }

  if (op.codigos) {
    d.cargosAgencia.slice(0, CELDAS_AGENCIA.length).forEach((x, i) => {
      const [rotulo, valor] = CELDAS_AGENCIA[i];
      c[rotulo] = x.codigo;
      c[valor] = monto(x.valor);
    });
  }
  if (op.fincas) {
    listaFincas(d).forEach((texto, i) => {
      if (i < CELDAS_FINCAS.length) c[CELDAS_FINCAS[i]] = texto;
    });
  }
  return c;
}

/** "Impresión Fincas": la marca como encabezado y después "fulls=finca". */
const listaFincas = (d: ImpresionGuiaMadre) => [...(d.marca ? [d.marca] : []), ...d.fincas.map((f) => f.texto)];

function Celda({ g, texto, limite }: { g: CeldaGeometria; texto: string; limite: number | null }) {
  const [x, y, w, h, pt, negrita, al] = g;
  const style: CSSProperties = {
    left: `${x}mm`,
    top: `${y}mm`,
    height: `${h}mm`,
    fontSize: `${pt}pt`,
    fontWeight: negrita ? 700 : 400,
    // Centro/derecha: dentro del ancho de la celda (desborda hacia los lados como Excel).
    justifyContent: al === 2 ? 'center' : al === 3 ? 'flex-end' : 'flex-start',
    width: al >= 2 ? `${w}mm` : undefined,
    // Izquierda: desborda hacia la derecha hasta la próxima celda con texto (como Excel).
    maxWidth: limite !== null ? `${limite}mm` : undefined,
  };
  return (
    <div className={`gm-c${limite !== null ? ' gm-recorte' : ''}`} style={style}>
      <span>{texto}</span>
    </div>
  );
}

function Cuadricula({ w, h }: { w: number; h: number }) {
  return (
    <div className="gm-cuadricula no-imprimir">
      {Array.from({ length: Math.floor(w / 10) }, (_, i) => (
        <span key={`x${i}`} className="gm-regla" style={{ left: `${(i + 1) * 10 + 0.4}mm`, top: '0.4mm' }}>
          {(i + 1) * 10}
        </span>
      ))}
      {Array.from({ length: Math.floor(h / 10) }, (_, i) => (
        <span key={`y${i}`} className="gm-regla" style={{ top: `${(i + 1) * 10 + 0.4}mm`, left: '0.4mm' }}>
          {(i + 1) * 10}
        </span>
      ))}
    </div>
  );
}

function HojaPapel({ d, op, perfil, cuadricula }: { d: ImpresionGuiaMadre; op: Opciones; perfil: Perfil; cuadricula: boolean }) {
  const turkish = esTurkish(d);
  const geo = turkish ? GEOMETRIA_TURKISH : GEOMETRIA_BASE;
  const cuadro = perfil.cuadro ? (turkish ? CUADRO_AEROLINEA.turkish : CUADRO_AEROLINEA.base) : null;
  const papel = PAPELES[perfil.papel];
  const celdas = Object.entries(celdasPapel(d, op))
    .filter(([k, t]) => t && geo[k])
    .map(([k, t]) => ({ k, t, g: geo[k] }));

  /** Ancho disponible a la derecha de una celda alineada a la izquierda. */
  const limite = (x: number, y: number) => {
    let fin = papel.w - 2;
    for (const o of celdas) if (Math.abs(o.g[1] - y) < 0.3 && o.g[0] > x + 0.1 && o.g[0] < fin) fin = o.g[0];
    if (cuadro && x < cuadro.x && y >= cuadro.y - 0.1 && y < cuadro.y + cuadro.h) fin = Math.min(fin, cuadro.x);
    return Math.max(fin - x - 0.3, 4);
  };

  return (
    <div className="gm-papel" style={{ width: `${papel.w}mm`, height: `${papel.h - 1}mm` }}>
      <div className="gm-datos" style={{ transform: `translate(${perfil.dx}mm, ${perfil.dy}mm)` }}>
        {celdas.map(({ k, t, g }) => (
          <Celda key={k} g={g} texto={t} limite={g[6] <= 1 ? limite(g[0], g[1]) : null} />
        ))}
        {cuadro && (
          <div className="gm-cuadro" style={{ left: `${cuadro.x}mm`, top: `${cuadro.y}mm`, width: `${cuadro.w}mm`, height: `${cuadro.h}mm` }}>
            <div>{d.aerolinea.nombre}</div>
            {d.aerolinea.ruc && <div>RUC: {d.aerolinea.ruc}</div>}
            {d.aerolinea.direccion.length > 0 && <div>DIRECCION: {d.aerolinea.direccion.join(' ')}</div>}
          </div>
        )}
      </div>
      {cuadricula && <Cuadricula w={papel.w} h={papel.h} />}
    </div>
  );
}

// ---------------------------------------------------------------- hoja blanca (formulario IATA completo)

function Caja({ l, children, className, style }: { l?: ReactNode; children?: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={`c${className ? ` ${className}` : ''}`} style={style}>
      {l && <span className="l">{l}</span>}
      {children}
    </div>
  );
}

function HojaBlanca({ d, op }: { d: ImpresionGuiaMadre; op: Opciones }) {
  const pp = d.pago === 'PP';
  const t = totalesImpresos(d, op);
  const tramo = (i: number) => d.tramos[i] ?? { hasta: null, por: null };
  const fincas = op.fincas ? listaFincas(d) : [];
  const otros = [
    ...d.cargosAerolinea.map((x) => ({ codigo: x.codigo, valor: x.valor })),
    ...(t.iva ? [{ codigo: d.iva.codigo, valor: t.iva }] : []),
    ...(op.codigos ? d.cargosAgencia : []),
  ];
  const columnas = '13mm 19mm 6mm 14mm 20mm 16mm 25mm 1fr';
  const izq = 'calc(50% - 0.15mm)';
  const filaCargo = (rotulo: string, prepaid: string, collect: string) => (
    <div className="r cargo">
      <span className="l centro">{rotulo}</span>
      <div className="v der">{prepaid}</div>
      <div className="v der">{collect}</div>
    </div>
  );

  return (
    <div className="awb">
      {/* Número de guía */}
      <div className="r" style={{ gridTemplateColumns: '14mm 14mm 1fr 1fr', height: '9mm' }}>
        <div className="c grande centro">{d.prefijo}</div>
        <div className="c v centro" style={{ fontSize: '10pt', alignSelf: 'center' }}>{d.origen.codigo}</div>
        <div className="c grande">{d.resto.replace(/^-/, '')}</div>
        <div className="c grande der">{d.numero}</div>
      </div>

      {/* Shipper | emisor */}
      <div className="r" style={{ gridTemplateColumns: `${izq} 1fr`, height: '28mm' }}>
        <Caja l={<><span>Shipper&apos;s Name and Address</span><span>Shipper&apos;s Account Number</span></>} className="dos-rotulos">
          <div className="v bloque">{d.shipper.filter(Boolean).join('\n')}</div>
        </Caja>
        <Caja>
          <span className="l">Not Negotiable</span>
          <div className="titulo">Air Waybill</div>
          <span className="l">Issued by</span>
          <div className="emisor">{d.aerolinea.nombre}</div>
          <div className="v" style={{ fontSize: '7.5pt' }}>
            {[d.aerolinea.ruc ? `RUC: ${d.aerolinea.ruc}` : '', d.aerolinea.direccion.join(' ')].filter(Boolean).join('\n')}
          </div>
          <span className="l fino">Copies 1, 2 and 3 of this Air Waybill are originals and have the same validity.</span>
        </Caja>
      </div>

      {/* Consignee | condiciones */}
      <div className="r" style={{ gridTemplateColumns: `${izq} 1fr`, height: '24mm' }}>
        <Caja l={<><span>Consignee&apos;s Name and Address</span><span>Consignee&apos;s Account Number</span></>} className="dos-rotulos">
          <div className="v bloque">{d.consignee.join('\n')}</div>
        </Caja>
        <Caja>
          <span className="l fino">
            It is agreed that the goods described herein are accepted in apparent good order and condition (except as noted)
            for carriage SUBJECT TO THE CONDITIONS OF CONTRACT ON THE REVERSE HEREOF. ALL GOODS MAY BE CARRIED BY ANY OTHER
            MEANS INCLUDING ROAD OR ANY OTHER CARRIER UNLESS SPECIFIC CONTRARY INSTRUCTIONS ARE GIVEN HEREON BY THE SHIPPER.
            THE SHIPPER&apos;S ATTENTION IS DRAWN TO THE NOTICE CONCERNING CARRIER&apos;S LIMITATION OF LIABILITY.
          </span>
        </Caja>
      </div>

      {/* Agente emisor + código IATA | Accounting information */}
      <div className="r" style={{ gridTemplateColumns: `${izq} 1fr`, gridTemplateRows: '18mm 8mm' }}>
        <Caja l="Issuing Carrier's Agent Name and City" className="abajo">
          <div className="v bloque">{d.agente.lineas.filter(Boolean).join('\n')}</div>
        </Caja>
        <Caja l="Accounting Information" style={{ gridRow: 'span 2', borderRight: 'none' }}>
          {d.notify.length > 0 && (
            <div className="v bloque" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: '2mm' }}>
              <span>PLS NOTIFY TO:</span>
              <span>{d.notify.join('\n')}</span>
            </div>
          )}
        </Caja>
        <div className="sub" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <Caja l="Agent's IATA Code">
            <div className="v">{d.agente.iata ?? ''}</div>
          </Caja>
          <Caja l="Account No." />
        </div>
      </div>

      {/* Aeropuerto de salida | referencia */}
      <div className="r" style={{ gridTemplateColumns: `${izq} 1fr 1fr`, height: '8mm' }}>
        <Caja l="Airport of Departure (Addr. of First Carrier) and Requested Routing">
          <div className="v" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{d.origen.aeropuerto}</span>
            <span>{d.ruta}</span>
          </div>
        </Caja>
        <Caja l="Reference Number" />
        <Caja l="Optional Shipping Information" />
      </div>

      {/* Ruta, moneda y valores declarados */}
      <div className="r" style={{ gridTemplateColumns: '12mm 27mm 11mm 11mm 11mm 11mm 10mm 10mm 8mm 8mm 8mm 8mm 1fr 1fr', height: '10mm' }}>
        <Caja l="To"><div className="v">{tramo(0).hasta ?? ''}</div></Caja>
        <Caja l="By First Carrier"><div className="v">{d.primerTransportista ?? ''}</div></Caja>
        <Caja l="to"><div className="v">{tramo(1).hasta ?? ''}</div></Caja>
        <Caja l="by"><div className="v">{tramo(1).por ?? ''}</div></Caja>
        <Caja l="to"><div className="v">{tramo(2).hasta ?? ''}</div></Caja>
        <Caja l="by"><div className="v">{tramo(2).por ?? ''}</div></Caja>
        <Caja l="Currency" className="centro angosta"><div className="v">USD</div></Caja>
        <Caja l="CHGS Code" className="centro angosta"><div className="v">{d.pago}</div></Caja>
        <Caja l="WT/VAL PPD" className="centro angosta"><div className="v">{pp ? 'PP' : ''}</div></Caja>
        <Caja l="COLL" className="centro angosta"><div className="v">{pp ? '' : 'CC'}</div></Caja>
        <Caja l="Other PPD" className="centro angosta"><div className="v">{pp ? 'PP' : ''}</div></Caja>
        <Caja l="COLL" className="centro angosta"><div className="v">{pp ? '' : 'CC'}</div></Caja>
        <Caja l="Declared Value for Carriage" className="centro"><div className="v">NVD</div></Caja>
        <Caja l="Declared Value for Customs" className="centro"><div className="v">NVC</div></Caja>
      </div>

      {/* Destino, vuelo, seguro */}
      <div className="r" style={{ gridTemplateColumns: '50mm 1fr 24mm 1fr', height: '9mm' }}>
        <Caja l="Airport of Destination"><div className="v">{d.destino.aeropuerto ?? d.destino.codigo ?? ''}</div></Caja>
        <Caja l="Requested Flight / Date"><div className="v">{[d.vuelo, d.fecha].filter(Boolean).join(' / ')}</div></Caja>
        <Caja l="Amount of Insurance" className="centro"><div className="v">NIL</div></Caja>
        <Caja>
          <span className="l fino">
            INSURANCE - If carrier offers insurance, and such insurance is requested in accordance with the conditions
            thereof, indicate amount to be insured in figures in box marked &quot;Amount of Insurance&quot;.
          </span>
        </Caja>
      </div>

      {/* Handling information */}
      <div className="r" style={{ gridTemplateColumns: '1fr', height: '10mm' }}>
        <Caja l="Handling Information">
          <div className="v">{d.manifiesto ? `MANIFIESTO: ${d.manifiesto}` : ''}</div>
        </Caja>
      </div>

      {/* Línea de tarifa */}
      <div className="r" style={{ gridTemplateColumns: columnas, height: '8mm' }}>
        {['No. of Pieces RCP', 'Gross Weight', 'kg lb', 'Rate Class / Commodity Item No.', 'Chargeable Weight', 'Rate / Charge', 'Total', 'Nature and Quantity of Goods (incl. Dimensions or Volume)'].map(
          (x) => (
            <Caja key={x} l={x} className="centro" />
          ),
        )}
      </div>
      <div className="r" style={{ gridTemplateColumns: columnas, flex: '1 1 auto', minHeight: '60mm' }}>
        <Caja className="mercancia centro"><div className="v">{general(d.piezas)}</div><div className="v">{general(d.piezas)}</div></Caja>
        <Caja className="mercancia centro"><div className="v">{general(d.kg)}</div><div className="v">{general(d.kg)}</div></Caja>
        <Caja className="mercancia centro"><div className="v">K</div><div className="v">K</div></Caja>
        <Caja className="mercancia" />
        <Caja className="mercancia centro"><div className="v">{general(d.pesoCobrable)}</div></Caja>
        <Caja className="mercancia centro"><div className="v">{tarifa(d.tarifa)}</div></Caja>
        <Caja className="mercancia der"><div className="v">{monto(d.flete)}</div><div className="v">{monto(d.flete)}</div></Caja>
        <Caja className="mercancia">
          <div>
            <div className="v">{['CONSOLIDATED', ...d.naturaleza].join('\n')}</div>
            {fincas.length > 0 && (
              <div className="fincas" style={{ columnCount: fincas.length > 30 ? 3 : 2 }}>
                {fincas.map((x, i) => (
                  <div key={i} style={i === 0 && d.marca ? { fontWeight: 700 } : undefined}>
                    {x}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="v" style={{ fontSize: '10pt' }}>TOTAL IN FULL: {fullsTotal(d.fulls)}</div>
        </Caja>
      </div>

      {/* Cargos (izquierda) | otros cargos y firmas (derecha) */}
      <div className="r" style={{ gridTemplateColumns: `${izq} 1fr`, borderBottom: '0.3mm solid #000' }}>
        <div className="col-cargos">
          <div className="r cargo">
            <span className="l centro">
              <span>Prepaid</span>
              <span>Weight Charge</span>
              <span>Collect</span>
            </span>
            <div className="v der">{pp ? monto(t.flete) : 'COLLECT'}</div>
            <div className="v der">{pp ? 'PREPAID' : monto(t.flete)}</div>
          </div>
          {filaCargo('Valuation Charge', '', '')}
          {filaCargo('Tax', pp && t.iva ? monto(t.iva) : '', !pp && t.iva ? monto(t.iva) : '')}
          {filaCargo('Total Other Charges Due Agent', pp && t.dueAgent ? monto(t.dueAgent) : '', !pp && t.dueAgent ? monto(t.dueAgent) : '')}
          {filaCargo('Total Other Charges Due Carrier', pp ? monto(t.dueCarrier) : '', pp ? '' : monto(t.dueCarrier))}
          {filaCargo('', '', '')}
          <div className="r cargo" style={{ height: '12mm', borderBottom: 'none' }}>
            <span className="l centro">
              <span>Total Prepaid</span>
              <span>Total Collect</span>
            </span>
            <div className="v der" style={{ fontSize: '10.5pt' }}>{pp ? monto(t.total) : 'COLLECT'}</div>
            <div className="v der" style={{ fontSize: '10.5pt' }}>{pp ? 'PREPAID' : monto(t.total)}</div>
          </div>
        </div>
        <div className="col-firmas">
          <Caja l="Other Charges" style={{ height: '21mm', borderRight: 'none' }}>
            <div className="otros">
              {otros.map((x, i) => (
                <span key={`${x.codigo}-${i}`} className="v">
                  {x.codigo}: {monto(x.valor)}
                </span>
              ))}
            </div>
          </Caja>
          <Caja className="firma" style={{ height: '21mm', borderTop: '0.3mm solid #000', borderRight: 'none' }}>
            <span className="l fino">
              Shipper certifies that the particulars on the face hereof are correct and that insofar as any part of the
              consignment contains dangerous goods, such part is properly described by name and is in proper condition for
              carriage by air according to the applicable Dangerous Goods Regulations.
            </span>
            <div className="v centro">{[d.agente.lineas[0], d.empresa.nombre + (d.empresa.ruc ? ` RUC ${d.empresa.ruc}` : '')].filter(Boolean).join('\n')}</div>
            <span className="l centro linea">Signature of Shipper or his Agent</span>
          </Caja>
          <div className="r ejecutado" style={{ gridTemplateColumns: '22mm 25mm 1fr', height: '12mm', borderTop: '0.3mm solid #000', borderBottom: 'none' }}>
            <Caja className="firma"><div className="v centro">{d.fecha}</div><span className="l centro linea">Executed on (date)</span></Caja>
            <Caja className="firma"><div className="v centro">{d.lugar}</div><span className="l centro linea">at (place)</span></Caja>
            <Caja className="firma" style={{ borderRight: 'none' }}>
              <div className="v centro">{[d.empresa.nombre, op.firma.toUpperCase()].filter(Boolean).join('\n')}</div>
              <span className="l centro linea">Signature of Issuing Carrier or its Agent</span>
            </Caja>
          </div>
        </div>
      </div>

      {/* Pie */}
      <div className="r" style={{ gridTemplateColumns: '30mm 30mm 30mm 1fr', height: '8mm', borderBottom: 'none' }}>
        <Caja l="For Carrier's Use only at Destination" />
        <Caja l="Charges at Destination" />
        <Caja l="Total Collect Charges" />
        <div className="c grande der" style={{ alignSelf: 'end' }}>{d.numero}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- estilos

// Hoja blanca: formulario en ≤ 194 × 262 mm (entra en A4 y en carta con 7 mm de margen).
// Papel de guía: solo los datos, en mm desde la esquina de la hoja, sin márgenes.
const CSS = `
.gm-hojas { display: flex; flex-direction: column; align-items: center; padding: 8mm 0; }
.gm-papel { position: relative; overflow: hidden; background: #fff; color: #000; box-shadow: 0 1px 4px rgba(0,0,0,.25);
  font-family: Arial, Helvetica, sans-serif; }
.gm-datos { position: absolute; inset: 0; }
.gm-c { position: absolute; display: flex; align-items: flex-end; white-space: nowrap; line-height: 1.1; }
.gm-c.gm-recorte { clip-path: inset(-20mm 0 -20mm -20mm); }
.gm-cuadro { position: absolute; font-size: 8pt; font-weight: 700; line-height: 1.2; overflow: hidden; background: #fff; }
.gm-cuadricula { position: absolute; inset: 0; pointer-events: none;
  background-image: linear-gradient(to right, rgba(37,99,235,.35) 0.2mm, transparent 0.2mm),
    linear-gradient(to bottom, rgba(37,99,235,.35) 0.2mm, transparent 0.2mm);
  background-size: 10mm 10mm; }
.gm-regla { position: absolute; font: 6pt Arial, sans-serif; color: rgba(37,99,235,.9); }

.awb { width: 194mm; height: 262mm; box-sizing: border-box; border: 0.4mm solid #000; background: #fff; color: #000;
  font: 8.5pt Arial, Helvetica, sans-serif; display: flex; flex-direction: column; overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,.25); }
.awb * { box-sizing: border-box; }
.awb .r { display: grid; border-bottom: 0.3mm solid #000; flex: none; }
.awb .sub { display: grid; border-top: 0.3mm solid #000; border-right: 0.3mm solid #000; }
.awb .c { border-right: 0.3mm solid #000; padding: 0.7mm 1.2mm; min-width: 0; overflow: hidden; }
.awb .r > .c:last-child, .awb .sub > .c:last-child { border-right: none; }
.awb .l { font-size: 6pt; font-style: italic; display: block; margin-bottom: 0.4mm; line-height: 1.1; }
.awb .dos-rotulos > .l { display: flex; justify-content: space-between; gap: 2mm; }
.awb .l.fino { font-size: 5.5pt; font-style: normal; }
.awb .v { font-weight: 700; text-transform: uppercase; line-height: 1.2; white-space: pre-line; }
.awb .v.bloque { font-size: 8pt; line-height: 1.15; }
.awb .angosta { padding: 0.7mm 0.4mm; }
.awb .angosta .l { font-size: 5.5pt; }
.awb .grande { font-size: 13pt; font-weight: 700; align-self: center; }
.awb .titulo { font-size: 14pt; font-weight: 700; font-style: italic; }
.awb .emisor { font-size: 12pt; font-weight: 700; text-transform: uppercase; }
.awb .centro { text-align: center; }
.awb .der { text-align: right; }
.awb .abajo { display: flex; flex-direction: column; }
.awb .mercancia { display: flex; flex-direction: column; justify-content: space-between; padding-top: 1.5mm; }
.awb .fincas { font-size: 6.5pt; line-height: 1.2; margin-top: 1mm; column-gap: 2mm; }
.awb .fincas > div { white-space: nowrap; overflow: hidden; }
.awb .col-cargos { border-right: 0.3mm solid #000; display: flex; flex-direction: column; }
.awb .col-firmas { display: flex; flex-direction: column; }
.awb .cargo { grid-template-columns: 1fr 1fr; grid-template-rows: auto 1fr; height: 7mm; }
.awb .cargo > .l { grid-column: 1 / -1; display: flex; justify-content: space-around; margin: 0; padding-top: 0.3mm; }
.awb .cargo > .v { padding: 0 1.5mm; font-size: 9.5pt; align-self: end; }
.awb .cargo > .v:first-of-type { border-right: 0.3mm solid #000; height: 100%; display: flex; align-items: flex-end; justify-content: flex-end; }
.awb .otros { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.6mm 3mm; }
.awb .firma { display: flex; flex-direction: column; justify-content: space-between; }
.awb .firma .linea { border-top: 0.2mm solid #000; padding-top: 0.3mm; margin: 0; }
.awb .ejecutado .v { font-size: 7.5pt; }

@media print {
  body * { visibility: hidden; }
  .gm-hojas, .gm-hojas * { visibility: visible; }
  .gm-hojas { position: absolute; left: 0; top: 0; padding: 0; }
  .gm-papel, .awb { box-shadow: none; }
  .no-imprimir { display: none !important; }
  .gm-raiz { min-height: 0 !important; background: #fff !important; }
}
`;

// ---------------------------------------------------------------- página

/**
 * Guía madre para imprimir, como "Guía Madre" de "Reportes..." del viejo
 * (también en pre-corte). Dos formatos: hoja blanca (formulario IATA
 * completo) o papel de guía preimpreso (solo los datos, en las posiciones de
 * la plantilla GM*.xlt de la aerolínea, con corrimiento calibrable por
 * aerolínea y guardado en este navegador).
 */
export function GuiaMadreImpresion({ id }: { id: number }) {
  const [formato, setFormato] = useState<Formato>('blanca');
  const [valores, setValores] = useState<Valores>('aerolinea');
  const [fincas, setFincas] = useState(true);
  const [codigos, setCodigos] = useState(false);
  const [cuadricula, setCuadricula] = useState(false);
  const [cambios, setCambios] = useState<Record<string, Perfil>>({});

  const { data: d, error, isLoading } = useSWR<ImpresionGuiaMadre>(
    ['operacion/impresion-madre', id, valores],
    async () => (await api.get(`/operacion/coordinaciones/${id}/guia-madre/impresion`, { params: { valores } })).data,
    { keepPreviousData: true, revalidateOnFocus: false },
  );

  const clave = d ? clavePerfil(d) : '';
  const guardado = useMemo(() => (d ? leerPerfil(clavePerfil(d), perfilDefecto(d)) : null), [d]);
  const perfil = d ? (cambios[clave] ?? guardado) : null;
  const cambiarPerfil = (p: Partial<Perfil>) => {
    if (!perfil) return;
    const nuevo = { ...perfil, ...p };
    setCambios((c) => ({ ...c, [clave]: nuevo }));
    guardarPerfil(clave, nuevo);
  };
  const mm = (k: 'dx' | 'dy') => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const n = parseFloat(e.target.value);
    if (Number.isFinite(n)) cambiarPerfil({ [k]: Math.round(n * 10) / 10 });
  };

  const op: Opciones = { fincas, codigos, firma: perfil?.firma ?? '' };
  const papel = perfil ? PAPELES[perfil.papel] : PAPELES.carta;
  const pagina =
    formato === 'papel' ? `@page { size: ${papel.w}mm ${papel.h}mm; margin: 0; }` : '@page { margin: 7mm; }';
  const sobran = d && fincas && formato === 'papel' ? listaFincas(d).length - CELDAS_FINCAS.length : 0;

  return (
    <Box className="gm-raiz" sx={{ bgcolor: '#e5e7eb', minHeight: '100vh' }}>
      <style>{CSS + pagina}</style>
      <Box
        className="no-imprimir"
        sx={{ position: 'sticky', top: 0, zIndex: 1, bgcolor: 'background.paper', px: 3, py: 1.5, borderBottom: 1, borderColor: 'divider' }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="h6" component="div" sx={{ flex: 1 }}>
            Guía madre {d?.numero ?? ''}
            {d && d.estado === 'BORRADOR' && <Chip size="small" color="warning" label="Pre-corte" sx={{ ml: 1.5 }} />}
            {d && d.valores === 'cliente' && <Chip size="small" color="info" label="Valores al cliente" sx={{ ml: 1 }} />}
          </Typography>
          <Button variant="contained" startIcon={<ImprimirIcon />} disabled={!d} onClick={() => window.print()}>
            Imprimir
          </Button>
          <Button onClick={() => window.close()}>Cerrar</Button>
        </Stack>
        {d && perfil && (
          <Stack direction="row" spacing={2} alignItems="center" useFlexGap flexWrap="wrap" sx={{ mt: 1.5 }}>
            <ToggleButtonGroup size="small" exclusive value={formato} onChange={(_, v: Formato | null) => v && setFormato(v)}>
              <ToggleButton value="blanca">Hoja blanca</ToggleButton>
              <ToggleButton value="papel">Papel de guía</ToggleButton>
            </ToggleButtonGroup>
            {d.hayCobroCliente && (
              <ToggleButtonGroup size="small" exclusive value={valores} onChange={(_, v: Valores | null) => v && setValores(v)}>
                <ToggleButton value="aerolinea">Aerolínea</ToggleButton>
                <ToggleButton value="cliente">Cliente</ToggleButton>
              </ToggleButtonGroup>
            )}
            <FormControlLabel control={<Checkbox size="small" checked={fincas} onChange={(e) => setFincas(e.target.checked)} />} label="Fincas" />
            <FormControlLabel
              control={<Checkbox size="small" checked={codigos} onChange={(e) => setCodigos(e.target.checked)} />}
              label="Códigos de agencia"
            />
            <TextField
              size="small"
              label="Firma"
              value={perfil.firma}
              onChange={(e) => cambiarPerfil({ firma: e.target.value })}
              sx={{ width: 200 }}
            />
            {formato === 'papel' && (
              <>
                <TextField
                  select
                  size="small"
                  label="Papel"
                  value={perfil.papel}
                  onChange={(e) => cambiarPerfil({ papel: e.target.value as Papel })}
                  sx={{ width: 180 }}
                >
                  {(Object.keys(PAPELES) as Papel[]).map((k) => (
                    <MenuItem key={k} value={k}>
                      {PAPELES[k].nombre}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  size="small"
                  type="number"
                  label="Mover X (mm)"
                  value={perfil.dx}
                  onChange={mm('dx')}
                  slotProps={{ htmlInput: { step: 0.5 } }}
                  sx={{ width: 120 }}
                />
                <TextField
                  size="small"
                  type="number"
                  label="Mover Y (mm)"
                  value={perfil.dy}
                  onChange={mm('dy')}
                  slotProps={{ htmlInput: { step: 0.5 } }}
                  sx={{ width: 120 }}
                />
                <FormControlLabel
                  control={<Checkbox size="small" checked={perfil.cuadro} onChange={(e) => cambiarPerfil({ cuadro: e.target.checked })} />}
                  label="Cuadro de la aerolínea"
                />
                <FormControlLabel
                  control={<Checkbox size="small" checked={cuadricula} onChange={(e) => setCuadricula(e.target.checked)} />}
                  label="Ver cuadrícula"
                />
              </>
            )}
          </Stack>
        )}
        {d && formato === 'papel' && (
          <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 1 }}>
            Papel, corrimiento, firma y cuadro se guardan en este navegador para {d.aerolinea.plantilla || d.aerolinea.nombre}.
            Imprimir con márgenes &quot;Ninguno&quot; y escala 100 %. X positivo mueve a la derecha; Y positivo, hacia abajo.
          </Typography>
        )}
        {sobran > 0 && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            {sobran === 1 ? 'Una finca no cabe' : `${sobran} fincas no caben`} en el papel de guía (como en el sistema viejo, hay
            lugar para {CELDAS_FINCAS.length - 1}).
          </Alert>
        )}
      </Box>
      {error && (
        <Alert severity="error" sx={{ m: 3 }} className="no-imprimir">
          {getErrorMessage(error, 'No se pudo armar la guía madre.')}
        </Alert>
      )}
      {isLoading && !d && <CircularProgress sx={{ m: 4 }} />}
      {d && perfil && (
        <div className="gm-hojas">
          {formato === 'papel' ? <HojaPapel d={d} op={op} perfil={perfil} cuadricula={cuadricula} /> : <HojaBlanca d={d} op={op} />}
        </div>
      )}
    </Box>
  );
}
