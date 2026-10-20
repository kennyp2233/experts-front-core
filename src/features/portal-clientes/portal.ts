import useSWR from 'swr';
import api from '@/shared/services/api';

// ---------------------------------------------------------------------------
// Tipos (lo que devuelve /portal-clientes/*)
// ---------------------------------------------------------------------------

export interface PerfilCliente {
  usuario: string;
  nombre: string;
  email: string | null;
  clientes: Array<{ id: number; nombre: string }>;
}

export type EstadoGuia = 'DESPACHADA' | 'EN_PREPARACION';

export interface Referencia {
  id: number;
  codigo: string | null;
  nombre: string;
}

export interface GuiaLista {
  id: number;
  numeroGuia: string | null;
  fechaVuelo: string;
  estado: EstadoGuia;
  aerolinea: Referencia | null;
  marca: Referencia | null;
  destino: Referencia | null;
  vuelo: string | null;
  fulls: number;
  cajas: number;
  kgs: number;
  guiasHijas: number;
}

export interface PaginaGuias {
  total: number;
  page: number;
  pageSize: number;
  items: GuiaLista[];
}

export interface FiltrosGuias {
  desde?: string;
  hasta?: string;
  q?: string;
  page?: number;
}

export interface TramoRuta {
  tipo: string;
  codigo: string | null;
  vuelo: string | null;
  salida: string | null;
  llegada: string | null;
}

export interface GuiaHijaCliente {
  id: number;
  numero: string;
  finca: string | null;
  dae: string | null;
  piezas: number;
  fulls: number;
  kgs: number;
  productos: string[];
  facturas: string[];
}

export interface CargosAerolinea {
  guiaAerea: number;
  combustible: number;
  seguridad: number;
  otros: number;
  aux1: number;
  aux2: number;
  calAux: number;
}

export interface CargosAgencia {
  cargoAwa: number;
  cargoCha: number;
  cargoPca: number;
  cargoTax: number;
  cargoMma: number;
  cargoHawb: number;
  cargoFitos: number;
}

export type EtiquetasAgencia = Record<keyof CargosAgencia, string | null>;

/** Lo que se le cobra al cliente por una guía (una fila del estado de cuenta). */
export interface CobroGuia {
  id: number;
  numeroGuia: string | null;
  fechaVuelo: string;
  aerolinea: Referencia | null;
  marca: Referencia | null;
  cliente?: Referencia | null;
  destino: Referencia | null;
  piezas: number;
  fulls: number;
  pesoBruto: number;
  pesoCobrable: number;
  tarifa: number;
  flete: number;
  cargosAerolinea: CargosAerolinea;
  dueCarrier: number;
  cargosAgencia: CargosAgencia;
  dueAgent: number;
  iva: number;
  totalGuia: number;
  handling: number;
  totalCobrar: number;
}

export interface DatosFactura {
  nombre: string | null;
  ruc: string | null;
  direccion: string | null;
  telefono: string | null;
  ciudad: string | null;
  pais: string | null;
}

export interface Liquidacion extends CobroGuia {
  clienteFactura: DatosFactura | null;
  etiquetasAgencia: EtiquetasAgencia;
}

export interface GuiaCliente {
  id: number;
  numeroGuia: string | null;
  fechaVuelo: string;
  estado: EstadoGuia;
  aerolinea: Referencia | null;
  marca: Referencia | null;
  destino: Referencia | null;
  destinoFinal: Referencia | null;
  pago: string | null;
  totales: { fulls: number; cajas: number; kgs: number };
  ruta: TramoRuta[];
  manifiesto: string | null;
  guiasHijas: GuiaHijaCliente[];
  liquidacion: Liquidacion | null;
}

export interface EstadoCuenta {
  cliente: {
    id: number;
    nombre: string;
    nombreFactura: string | null;
    ruc: string | null;
    direccion: string | null;
    telefono: string | null;
    ciudad: string | null;
    pais: string | null;
    email: string | null;
  };
  desde: string;
  hasta: string;
  etiquetasAgencia: EtiquetasAgencia;
  filas: CobroGuia[];
  totales: {
    guias: number;
    piezas: number;
    fulls: number;
    pesoBruto: number;
    flete: number;
    dueCarrier: number;
    dueAgent: number;
    iva: number;
    totalGuia: number;
    handling: number;
    totalCobrar: number;
  };
}

export interface FiltrosEstadoCuenta {
  desde: string;
  hasta: string;
  idCliente?: number;
}

// ---------------------------------------------------------------------------
// Servicio y hooks
// ---------------------------------------------------------------------------

const limpiar = (f: object) => Object.fromEntries(Object.entries(f).filter(([, v]) => v !== undefined && v !== null && v !== ''));

export const portalClientesService = {
  perfil: async (): Promise<PerfilCliente> => (await api.get('/portal-clientes/perfil')).data,
  guias: async (f: FiltrosGuias): Promise<PaginaGuias> => (await api.get('/portal-clientes/guias', { params: limpiar(f) })).data,
  guia: async (id: number): Promise<GuiaCliente> => (await api.get(`/portal-clientes/guias/${id}`)).data,
  estadoCuenta: async (f: FiltrosEstadoCuenta): Promise<EstadoCuenta> =>
    (await api.get('/portal-clientes/estado-cuenta', { params: limpiar(f) })).data,
  estadoCuentaExcel: async (f: FiltrosEstadoCuenta): Promise<Blob> =>
    (await api.get('/portal-clientes/estado-cuenta.xlsx', { params: limpiar(f), responseType: 'blob' })).data,
};

export const usePerfilCliente = () =>
  useSWR<PerfilCliente>('portal-clientes/perfil', portalClientesService.perfil, { revalidateOnFocus: false });

export const useGuiasCliente = (f: FiltrosGuias) =>
  useSWR<PaginaGuias>(['portal-clientes/guias', f.desde, f.hasta, f.q, f.page], () => portalClientesService.guias(f), {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });

export const useGuiaCliente = (id: number) =>
  useSWR<GuiaCliente>(['portal-clientes/guia', id], () => portalClientesService.guia(id), { revalidateOnFocus: false });

export const useEstadoCuenta = (f: FiltrosEstadoCuenta | null) =>
  useSWR<EstadoCuenta>(f ? ['portal-clientes/estado-cuenta', f.desde, f.hasta, f.idCliente] : null, () => portalClientesService.estadoCuenta(f!), {
    revalidateOnFocus: false,
  });

// ---------------------------------------------------------------------------
// Formato
// ---------------------------------------------------------------------------

const fmtUsd = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtNum = new Intl.NumberFormat('es-EC', { maximumFractionDigits: 2 });

/** Dólares con 2 decimales: "$ 1.234,50". */
export const usd = (n: number | null | undefined) => fmtUsd.format(n ?? 0);

/** Cantidades (fulls, kilos, piezas) con hasta 2 decimales. */
export const num = (n: number | null | undefined) => fmtNum.format(n ?? 0);

/** "369-1176 3846". */
export const formatoGuia = (n: string | null) => {
  const d = (n ?? '').replace(/\D/g, '');
  return d.length === 11 ? `${d.slice(0, 3)}-${d.slice(3, 7)} ${d.slice(7)}` : (n ?? '—');
};

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** "2026-10-20" → "20/10/2026" sin pasar por zonas horarias. */
export const fechaCorta = (iso: string | null | undefined) => {
  const m = (iso ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : (iso ?? '—');
};

/** "20 de octubre de 2026". */
export const fechaLarga = (iso: string | null | undefined) => {
  const m = (iso ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${Number(m[3])} de ${MESES[Number(m[2]) - 1]} de ${m[1]}` : (iso ?? '—');
};

/** Fecha (y hora si la trae) de un instante, en hora de Ecuador. */
export function fechaHora(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const partes = new Intl.DateTimeFormat('es-EC', {
    timeZone: 'America/Guayaquil',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const p = (t: string) => partes.find((x) => x.type === t)?.value ?? '';
  const fecha = `${p('day')}/${p('month')}/${p('year')}`;
  const hora = `${p('hour')}:${p('minute')}`;
  return hora === '00:00' || hora === '24:00' ? fecha : `${fecha} ${hora}`;
}

export const nombreEstado = (e: EstadoGuia) => (e === 'DESPACHADA' ? 'Despachada' : 'En preparación');

// ---------------------------------------------------------------------------
// Liquidación: los conceptos con nombres claros para el cliente
// ---------------------------------------------------------------------------

export const CARGOS_AEROLINEA: Array<[keyof CargosAerolinea, string]> = [
  ['guiaAerea', 'Guía aérea'],
  ['combustible', 'Combustible'],
  ['seguridad', 'Seguridad'],
  ['otros', 'Otros cargos'],
  ['aux1', 'Cargo adicional 1'],
  ['aux2', 'Cargo adicional 2'],
  ['calAux', 'Cargo adicional calculado'],
];

/** Nombre legible de cada cargo de agencia; el código con que se factura va entre paréntesis. */
export const CARGOS_AGENCIA: Array<[keyof CargosAgencia, string]> = [
  ['cargoAwa', 'Form A'],
  ['cargoCha', 'Transport'],
  ['cargoPca', 'PCA'],
  ['cargoTax', 'Termógrafo'],
  ['cargoMma', 'MCA'],
  ['cargoHawb', 'Tax'],
  ['cargoFitos', 'Fitos'],
];

export const nombreCargoAgencia = (k: keyof CargosAgencia, etiquetas: EtiquetasAgencia | null | undefined) => {
  const nombre = CARGOS_AGENCIA.find(([c]) => c === k)?.[1] ?? k;
  const codigo = etiquetas?.[k];
  return codigo ? `${nombre} (${codigo})` : nombre;
};

export interface RenglonLiquidacion {
  tipo: 'seccion' | 'linea' | 'subtotal' | 'total';
  concepto: string;
  detalle?: string;
  valor?: number;
}

/**
 * Arma la liquidación renglón por renglón: flete, cargos de la aerolínea,
 * cargos de la agencia, IVA, total de la guía, handling (aparte) y total a
 * pagar. Solo muestra los cargos que valen algo.
 */
export function armarLiquidacion(l: Liquidacion): RenglonLiquidacion[] {
  const r: RenglonLiquidacion[] = [];

  r.push({ tipo: 'seccion', concepto: 'Flete' });
  r.push({ tipo: 'linea', concepto: 'Flete', detalle: `${num(l.pesoCobrable)} kg cobrables × ${usd(l.tarifa)} por kg`, valor: l.flete });

  r.push({ tipo: 'seccion', concepto: 'Cargos de la aerolínea' });
  for (const [k, nombre] of CARGOS_AEROLINEA) if (l.cargosAerolinea[k]) r.push({ tipo: 'linea', concepto: nombre, valor: l.cargosAerolinea[k] });
  r.push({ tipo: 'subtotal', concepto: 'Total cargos de la aerolínea', valor: l.dueCarrier });

  r.push({ tipo: 'seccion', concepto: 'Cargos de la agencia' });
  for (const [k] of CARGOS_AGENCIA) {
    if (l.cargosAgencia[k]) r.push({ tipo: 'linea', concepto: nombreCargoAgencia(k, l.etiquetasAgencia), valor: l.cargosAgencia[k] });
  }
  r.push({ tipo: 'subtotal', concepto: 'Total cargos de la agencia', valor: l.dueAgent });

  r.push({ tipo: 'linea', concepto: 'IVA', valor: l.iva });
  r.push({ tipo: 'total', concepto: 'Total de la guía', detalle: 'Flete + cargos de la aerolínea + cargos de la agencia + IVA', valor: l.totalGuia });
  r.push({ tipo: 'linea', concepto: 'Handling', detalle: 'Se cobra aparte del total de la guía', valor: l.handling });
  r.push({ tipo: 'total', concepto: 'TOTAL A PAGAR', valor: l.totalCobrar });
  return r;
}

// ---------------------------------------------------------------------------
// Ruta y vuelo
// ---------------------------------------------------------------------------

export interface TramoLegible {
  desde: string;
  hasta: string;
  aerolinea: string | null;
  vuelo: string | null;
  salida: string | null;
  llegada: string | null;
}

/** Une ORIGEN / DESTINOn / VIAn en tramos "desde → hasta, con tal aerolínea". */
export function tramosDeRuta(ruta: TramoRuta[]): TramoLegible[] {
  const tipo = (t: string) => ruta.find((x) => x.tipo === t);
  const tramos: TramoLegible[] = [];
  let desde = tipo('ORIGEN')?.codigo ?? null;
  for (let n = 1; n <= 4; n++) {
    const destino = tipo(`DESTINO${n}`);
    if (!destino?.codigo) break;
    const via = tipo(`VIA${n}`);
    tramos.push({
      desde: desde ?? '—',
      hasta: destino.codigo,
      aerolinea: via?.codigo ?? null,
      vuelo: via?.vuelo ?? destino.vuelo ?? null,
      salida: via?.salida ?? null,
      llegada: destino.llegada ?? via?.llegada ?? null,
    });
    desde = destino.codigo;
  }
  return tramos;
}

// ---------------------------------------------------------------------------
// Estado de cuenta: columnas (las usan la pantalla y la hoja impresa)
// ---------------------------------------------------------------------------

export interface ColumnaCobro {
  key: string;
  label: string;
  align: 'left' | 'right';
  /** Texto de la celda. */
  celda: (f: CobroGuia) => string;
  /** Texto del pie con los totales (vacío si no suma). */
  pie?: (t: EstadoCuenta['totales'], filas: CobroGuia[]) => string;
}

export const COLUMNAS_COBRO: ColumnaCobro[] = [
  { key: 'fecha', label: 'Fecha de vuelo', align: 'left', celda: (f) => fechaCorta(f.fechaVuelo) },
  { key: 'guia', label: 'Guía', align: 'left', celda: (f) => formatoGuia(f.numeroGuia), pie: (t) => `${t.guias} ${t.guias === 1 ? 'guía' : 'guías'}` },
  { key: 'marca', label: 'Marca', align: 'left', celda: (f) => f.marca?.nombre ?? '—' },
  { key: 'destino', label: 'Destino', align: 'left', celda: (f) => f.destino?.nombre ?? '—' },
  { key: 'piezas', label: 'Piezas', align: 'right', celda: (f) => num(f.piezas), pie: (t) => num(t.piezas) },
  { key: 'kg', label: 'Kg', align: 'right', celda: (f) => num(f.pesoBruto), pie: (t) => num(t.pesoBruto) },
  {
    key: 'cobrable',
    label: 'Peso cobrable',
    align: 'right',
    celda: (f) => num(f.pesoCobrable),
    pie: (_t, filas) => num(filas.reduce((s, f) => s + f.pesoCobrable, 0)),
  },
  { key: 'tarifa', label: 'Tarifa', align: 'right', celda: (f) => usd(f.tarifa) },
  { key: 'flete', label: 'Flete', align: 'right', celda: (f) => usd(f.flete), pie: (t) => usd(t.flete) },
  { key: 'aerolinea', label: 'Cargos aerolínea', align: 'right', celda: (f) => usd(f.dueCarrier), pie: (t) => usd(t.dueCarrier) },
  { key: 'agencia', label: 'Cargos agencia', align: 'right', celda: (f) => usd(f.dueAgent), pie: (t) => usd(t.dueAgent) },
  { key: 'iva', label: 'IVA', align: 'right', celda: (f) => usd(f.iva), pie: (t) => usd(t.iva) },
  { key: 'totalGuia', label: 'Total guía', align: 'right', celda: (f) => usd(f.totalGuia), pie: (t) => usd(t.totalGuia) },
  { key: 'handling', label: 'Handling', align: 'right', celda: (f) => usd(f.handling), pie: (t) => usd(t.handling) },
  { key: 'total', label: 'Total a pagar', align: 'right', celda: (f) => usd(f.totalCobrar), pie: (t) => usd(t.totalCobrar) },
];

// ---------------------------------------------------------------------------
// Períodos (quincenas) para el estado de cuenta
// ---------------------------------------------------------------------------

/** "2026-10-20": hoy en Ecuador. */
export const hoyEcuador = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil' }).format(new Date());

export interface Periodo {
  etiqueta: string;
  desde: string;
  hasta: string;
}

export interface MesPeriodos {
  titulo: string;
  periodos: Periodo[];
}

const dosD = (n: number) => String(n).padStart(2, '0');

/** Mes actual y anterior, cada uno con sus dos quincenas y el mes completo. */
export function periodosRapidos(hoy: string): MesPeriodos[] {
  const [y, m] = hoy.split('-').map(Number);
  const meses = [
    { y, m },
    m === 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 },
  ];
  return meses.map(({ y, m }) => {
    const ultimo = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const mes = `${y}-${dosD(m)}`;
    const nombre = MESES[m - 1];
    return {
      titulo: `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} ${y}`,
      periodos: [
        { etiqueta: '1 al 15', desde: `${mes}-01`, hasta: `${mes}-15` },
        { etiqueta: `16 al ${ultimo}`, desde: `${mes}-16`, hasta: `${mes}-${ultimo}` },
        { etiqueta: 'Mes completo', desde: `${mes}-01`, hasta: `${mes}-${ultimo}` },
      ],
    };
  });
}

/** La quincena en que cae hoy (la que se abre por defecto). */
export function quincenaActual(hoy: string): Periodo {
  const [grupo] = periodosRapidos(hoy);
  const dia = Number(hoy.slice(8, 10));
  return dia <= 15 ? grupo.periodos[0] : grupo.periodos[1];
}

/** Descarga un archivo que el servidor mandó como blob. */
export function descargarBlob(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
