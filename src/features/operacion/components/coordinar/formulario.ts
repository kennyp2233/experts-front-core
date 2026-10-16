import { toIsoDate } from '@/shared/utils';
import type {
  CoordinacionDetalle,
  GuardarCoordinacionDto,
  LineaCoordinacionDto,
  ParametrosCoordinacion,
  ValoresLiquidacion,
} from '../../types/coordinacion';

/**
 * Modelo del formulario de coordinar. Los números se guardan como texto (lo
 * que el usuario escribe, admite coma decimal) y se convierten al armar el DTO.
 * Los campos `auto*` indican que el valor es un default calculado y se sigue
 * recalculando hasta que el usuario lo edita (como la grilla del sistema viejo).
 */
export interface LineaForm {
  key: string;
  idFinca: number | null;
  idProducto: number | null;
  idTipoCaja: number | null;
  cajas: string;
  fulls: string;
  pesoKg: string;
  tallos: string;
  valor: string;
  dae: string;
  largo: string;
  ancho: string;
  alto: string;
  nota: string;
  auto: { fulls: boolean; pesoKg: boolean; tallos: boolean; valor: boolean; medidas: boolean };
}

export interface CabeceraForm {
  idGuiaMadre: number | null;
  idAerolinea: number | null;
  idConsignatario: number | null;
  idAgenciaIata: number | null;
  idDestinoAwb: number | null;
  idDestinoFinalDocs: number | null;
  idTipoEmbarque: number | null;
  pago: 'PREPAID' | 'COLLECT';
  fechaVuelo: string;
  referencia: string;
  nota: string;
  /** Vuelo y manifiesto: los da la aerolínea; pueden llegar después de coordinar. */
  vuelo: string;
  /** "YYYY-MM-DDTHH:mm" en hora local (input datetime-local). */
  salida: string;
  llegada: string;
  numeroManifiesto: string;
  secuencial: string;
}

export type LiquidacionForm = Partial<Record<keyof ValoresLiquidacion, string>>;

export interface FormCoordinar {
  cabecera: CabeceraForm;
  lineas: LineaForm[];
  /** Lo que cobra la aerolínea (va en la guía madre). */
  liquidacion: LiquidacionForm;
  /** true: al cliente se le cobra distinto que la guía madre (96 % de las guías del sistema viejo). */
  conCliente: boolean;
  /** Solo lo que cambia para el cliente; lo vacío es igual a la guía madre. */
  cliente: LiquidacionForm;
  /** true mientras tarifa y conceptos de aerolínea sean los sugeridos (no editados). */
  liqAuto: boolean;
  /** true mientras el handling al cliente sea el de la ficha del cliente. */
  handlingAuto: boolean;
  /** true mientras el cobro al cliente sea el propuesto (última guía de la marca). */
  clienteAuto: boolean;
}

/** Campos de la liquidación que no van en el cobro al cliente (Access los guarda solo en el normal). */
export const SOLO_GUIA_MADRE = ['aux3Handling', 'auxOtros', 'tarifaAcordada'] as const;

let secuencia = 0;
const nuevaKey = () => `l${Date.now().toString(36)}${(secuencia++).toString(36)}`;

/** "1,5" → 1.5; vacío o inválido → undefined. */
export const numero = (t: string | undefined | null): number | undefined => {
  if (t === undefined || t === null) return undefined;
  const s = t.trim().replace(/\s/g, '').replace(',', '.');
  if (s === '') return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};

/** Número → texto para el input, con coma decimal como el resto de la pantalla ("1,5"; sin ceros de más). */
export const texto = (n: number | null | undefined, decimales = 2): string =>
  n === null || n === undefined ? '' : String(Math.round(n * 10 ** decimales) / 10 ** decimales).replace('.', ',');

/** Formato de la DAE: 055-AAAA-40-XXXXXXXX. */
export const PATRON_DAE = /^\d{3}-\d{4}-\d{2}-\d{8}$/;

/**
 * Pone los guiones de la DAE mientras se escribe ("055202640" → "055-2026-40-").
 * Al borrar (texto más corto que antes) no agrega el guion final, para poder borrarlo.
 */
export function formatearDae(nuevo: string, anterior = ''): string {
  const d = nuevo.replace(/\D/g, '').slice(0, 17);
  const partes = [d.slice(0, 3), d.slice(3, 7), d.slice(7, 9), d.slice(9)].filter(Boolean);
  const bloqueCompleto = [3, 7, 9].includes(d.length) && nuevo.length > anterior.length;
  return partes.join('-') + (bloqueCompleto ? '-' : '');
}

/** "055-2026-40-12345678" → "055-2026-40-" (para la fila siguiente). */
export const prefijoDae = (dae: string) => /^(\d{3}-\d{4}-\d{2}-)/.exec(dae.trim())?.[1] ?? '';

export const lineaVacia = (base?: Partial<LineaForm>): LineaForm => ({
  key: nuevaKey(),
  idFinca: null,
  idProducto: null,
  idTipoCaja: null,
  cajas: '',
  fulls: '',
  pesoKg: '',
  tallos: '',
  valor: '',
  dae: '',
  largo: '',
  ancho: '',
  alto: '',
  nota: '',
  auto: { fulls: true, pesoKg: true, tallos: true, valor: true, medidas: true },
  ...base,
});

// Hora local: con toISOString (UTC), después de las 19:00 en Ecuador proponía el día siguiente.
const hoy = () => toIsoDate(new Date());

export const formVacio = (): FormCoordinar => ({
  cabecera: {
    idGuiaMadre: null,
    idAerolinea: null,
    idConsignatario: null,
    idAgenciaIata: null,
    idDestinoAwb: null,
    idDestinoFinalDocs: null,
    idTipoEmbarque: null,
    pago: 'PREPAID',
    fechaVuelo: hoy(),
    referencia: '',
    nota: '',
    vuelo: '',
    salida: '',
    llegada: '',
    numeroManifiesto: '',
    secuencial: '',
  },
  lineas: [lineaVacia()],
  liquidacion: {},
  conCliente: true,
  cliente: {},
  liqAuto: true,
  handlingAuto: true,
  clienteAuto: true,
});

/**
 * Defaults de la línea (frmPIN_CoorDetail + _PIN_MParams): fulls = cajas ×
 * factor de la caja; kg = fulls × cajas por full × kg por caja; tallos = fulls ×
 * tallos por full; valor = cajas × valor por caja. Solo toca los campos `auto`.
 */
export function recalcularLinea(l: LineaForm, p: ParametrosCoordinacion | undefined): LineaForm {
  if (!p) return l;
  const out = { ...l };
  const cajas = numero(l.cajas);
  const factor = p.tiposCaja.find((t) => t.id === l.idTipoCaja)?.factorFull;
  if (out.auto.fulls) out.fulls = cajas !== undefined && factor !== undefined ? texto(cajas * factor, 4) : '';
  const fulls = numero(out.fulls);
  if (out.auto.pesoKg) out.pesoKg = fulls !== undefined ? texto(fulls * p.lineas.cajasPorFull * p.lineas.kgPorCaja) : '';
  if (out.auto.tallos) out.tallos = fulls !== undefined ? texto(fulls * p.lineas.tallosPorFull, 0) : '';
  if (out.auto.valor) out.valor = cajas !== undefined ? texto(cajas * p.lineas.valorPorCaja) : '';
  return out;
}

/** Línea con lo mínimo para mandarla al servidor. */
export const lineaCompleta = (l: LineaForm) =>
  l.idFinca !== null && l.idProducto !== null && numero(l.cajas) !== undefined && numero(l.pesoKg) !== undefined;

export function aDto(f: FormCoordinar): GuardarCoordinacionDto | null {
  const c = f.cabecera;
  if (!c.idGuiaMadre || !c.idConsignatario || !c.idAgenciaIata || !c.idDestinoAwb || !c.fechaVuelo) return null;
  const lineas: LineaCoordinacionDto[] = f.lineas.filter(lineaCompleta).map((l) => ({
    idFinca: l.idFinca!,
    idProducto: l.idProducto!,
    cantidadCajas: numero(l.cajas)!,
    idTipoCaja: l.idTipoCaja ?? undefined,
    fulls: l.auto.fulls ? undefined : numero(l.fulls),
    pesoKg: numero(l.pesoKg)!,
    tallos: numero(l.tallos),
    valor: numero(l.valor),
    // El servidor exige la DAE; se manda vacía para que la vista previa avise.
    dae: l.dae.trim() || '-',
    largo: numero(l.largo),
    ancho: numero(l.ancho),
    alto: numero(l.alto),
    nota: l.nota.trim() || undefined,
  }));
  if (lineas.length === 0) return null;
  const liquidacion = valoresDe(f.liquidacion);
  return {
    idGuiaMadre: c.idGuiaMadre,
    idConsignatario: c.idConsignatario,
    idAgenciaIata: c.idAgenciaIata,
    idDestinoAwb: c.idDestinoAwb,
    idDestinoFinalDocs: c.idDestinoFinalDocs ?? undefined,
    idTipoEmbarque: c.idTipoEmbarque ?? undefined,
    pago: c.pago,
    fechaVuelo: c.fechaVuelo,
    referencia: c.referencia.trim() || undefined,
    nota: c.nota.trim() || undefined,
    vuelo: vueloDto(c),
    lineas,
    liquidacion,
    cobroCliente: f.conCliente ? cobroCliente(f) : undefined,
  };
}

/** "2026-10-20T10:11" (hora local) ↔ ISO. */
const aIso = (local: string) => (local ? new Date(local).toISOString() : undefined);
const aLocal = (iso: string | null | undefined) => {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

function vueloDto(c: CabeceraForm): GuardarCoordinacionDto['vuelo'] {
  const v = {
    vuelo: c.vuelo.trim().toUpperCase() || undefined,
    salida: aIso(c.salida),
    llegada: aIso(c.llegada),
    numeroManifiesto: c.numeroManifiesto.replace(/\D/g, '') || undefined,
    secuencial: c.secuencial.replace(/\D/g, '') || undefined,
  };
  return Object.values(v).some(Boolean) ? v : undefined;
}

function valoresDe(form: LiquidacionForm): ValoresLiquidacion {
  const out: ValoresLiquidacion = {};
  for (const [k, v] of Object.entries(form)) {
    const n = numero(v);
    if (n !== undefined) out[k as keyof ValoresLiquidacion] = n;
  }
  return out;
}

/** Cobro al cliente efectivo: la guía madre con lo que cambia para el cliente encima. */
export function cobroCliente(f: FormCoordinar): ValoresLiquidacion {
  const base = valoresDe(f.liquidacion);
  for (const k of SOLO_GUIA_MADRE) delete base[k];
  const cambios = valoresDe(f.cliente);
  return { ...base, ...cambios };
}

/** Id del campo en la página (para marcarlo y llevar la pantalla hasta él). */
export const ID_CAMPO = {
  guia: 'coordinar-guia',
  fecha: 'coordinar-fecha',
  consignatario: 'coordinar-consignatario',
  agencia: 'coordinar-agencia',
  destino: 'coordinar-destino',
  fincas: 'coordinar-fincas',
  fila: (key: string, campo: 'finca' | 'producto' | 'cajas' | 'kg' | 'dae') => `coordinar-${key}-${campo}`,
} as const;

export interface Faltante {
  /** Id del campo (ver ID_CAMPO). */
  campo: string;
  mensaje: string;
}

/** Lo que falta para grabar (lo mismo que valida el servidor), en el orden de la pantalla. */
export function faltantes(f: FormCoordinar, nombresFinca: Record<number, string> = {}): Faltante[] {
  const c = f.cabecera;
  const out: Faltante[] = [];
  if (!c.idGuiaMadre) out.push({ campo: ID_CAMPO.guia, mensaje: 'Elige la guía madre.' });
  if (!c.fechaVuelo) out.push({ campo: ID_CAMPO.fecha, mensaje: 'Falta la fecha de vuelo.' });
  if (!c.idConsignatario) out.push({ campo: ID_CAMPO.consignatario, mensaje: 'Elige el consignatario.' });
  if (!c.idAgenciaIata) out.push({ campo: ID_CAMPO.agencia, mensaje: 'Elige la agencia IATA.' });
  if (!c.idDestinoAwb) out.push({ campo: ID_CAMPO.destino, mensaje: 'Elige el destino de la guía.' });
  const usadas = f.lineas.filter((l) => l.idFinca !== null || l.idProducto !== null || l.cajas.trim());
  if (usadas.length === 0) out.push({ campo: ID_CAMPO.fila(f.lineas[0]?.key ?? '', 'finca'), mensaje: 'Agrega al menos una finca.' });
  usadas.forEach((l) => {
    const n = f.lineas.indexOf(l) + 1;
    const fila = l.idFinca !== null && nombresFinca[l.idFinca] ? `Fila ${n} (${nombresFinca[l.idFinca]})` : `Fila ${n}`;
    if (l.idFinca === null) out.push({ campo: ID_CAMPO.fila(l.key, 'finca'), mensaje: `${fila}: falta la finca.` });
    if (l.idProducto === null) out.push({ campo: ID_CAMPO.fila(l.key, 'producto'), mensaje: `${fila}: falta el producto.` });
    if (numero(l.cajas) === undefined) out.push({ campo: ID_CAMPO.fila(l.key, 'cajas'), mensaje: `${fila}: faltan las cajas.` });
    if (numero(l.pesoKg) === undefined) out.push({ campo: ID_CAMPO.fila(l.key, 'kg'), mensaje: `${fila}: falta el peso (kg).` });
    if (!l.dae.trim()) out.push({ campo: ID_CAMPO.fila(l.key, 'dae'), mensaje: `${fila}: falta la DAE.` });
  });
  return out;
}

/** Coordinación guardada → formulario (para editar). */
export function desdeDetalle(c: CoordinacionDetalle): FormCoordinar {
  const via = c.rutas.find((r) => r.tipoRuta.startsWith('VIA') && (r.vuelo || r.fechaHoraSalida));
  const normal = c.liquidaciones.find((l) => l.tipo === 'NORMAL');
  const extra = c.corteExtra ? c.liquidaciones.find((l) => l.tipo === 'CORTE_EXTRA') : undefined;
  const liquidacion: LiquidacionForm = {};
  const cliente: LiquidacionForm = {};
  const campo = (k: string) => typeof k === 'string' && k !== 'handling' && k !== 'tipo' && k !== 'resumen';
  if (normal) {
    for (const [k, v] of Object.entries(normal)) {
      if (campo(k) && typeof v === 'number') liquidacion[k as keyof ValoresLiquidacion] = texto(v, 4);
    }
  }
  // Del cobro al cliente solo se cargan los valores que cambian respecto a la guía madre.
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (!campo(k) || typeof v !== 'number') continue;
      const n = normal?.[k as keyof typeof normal];
      if ((typeof n === 'number' ? n : 0) !== v) cliente[k as keyof ValoresLiquidacion] = texto(v, 4);
    }
  }
  return {
    cabecera: {
      idGuiaMadre: c.guiaMadre.id,
      idAerolinea: c.aerolinea?.id ?? null,
      idConsignatario: c.consignatario?.id ?? null,
      idAgenciaIata: c.agencia?.id ?? null,
      idDestinoAwb: c.destino?.id ?? null,
      idDestinoFinalDocs: c.destinoFinal?.id ?? null,
      idTipoEmbarque: c.tipoEmbarque?.id ?? null,
      pago: c.pago,
      fechaVuelo: c.fechaVuelo.slice(0, 10),
      referencia: c.referencia ?? '',
      nota: c.nota ?? '',
      vuelo: via?.vuelo ?? c.manifiesto?.vuelo ?? '',
      salida: aLocal(via?.fechaHoraSalida),
      llegada: aLocal(via?.fechaHoraLlegada),
      numeroManifiesto: c.manifiesto?.numero ?? '',
      secuencial: c.manifiesto?.secuencial ?? '',
    },
    lineas: c.guias.flatMap((g) =>
      g.lineas.map((l) =>
        lineaVacia({
          idFinca: g.finca?.id ?? null,
          idProducto: l.producto?.id ?? null,
          idTipoCaja: l.tipoCaja?.id ?? null,
          cajas: texto(l.cantidadCajas, 0),
          fulls: texto(l.fulls, 4),
          pesoKg: texto(l.pesoKg),
          tallos: texto(l.tallos, 0),
          valor: texto(l.valor),
          dae: l.dae ?? g.dae ?? '',
          largo: texto(l.largo),
          ancho: texto(l.ancho),
          alto: texto(l.alto),
          nota: l.nota ?? '',
          auto: { fulls: l.tipoCaja !== null, pesoKg: false, tallos: false, valor: false, medidas: false },
        }),
      ),
    ),
    liquidacion,
    conCliente: !!extra,
    cliente,
    liqAuto: false,
    handlingAuto: false,
    clienteAuto: false,
  };
}
