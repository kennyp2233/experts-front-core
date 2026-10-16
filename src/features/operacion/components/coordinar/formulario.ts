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

/** Número → texto para el input (sin ceros de más). */
export const texto = (n: number | null | undefined, decimales = 2): string =>
  n === null || n === undefined ? '' : String(Math.round(n * 10 ** decimales) / 10 ** decimales);

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

const hoy = () => new Date().toISOString().slice(0, 10);

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
    lineas,
    liquidacion,
    cobroCliente: f.conCliente ? cobroCliente(f) : undefined,
  };
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

/** Problemas que impiden guardar (los mismos que valida el servidor). */
export function faltantes(f: FormCoordinar): string[] {
  const c = f.cabecera;
  const out: string[] = [];
  if (!c.idGuiaMadre) out.push('Elige la guía (AWB).');
  if (!c.fechaVuelo) out.push('Falta la fecha de vuelo.');
  if (!c.idConsignatario) out.push('Elige el consignatario (marca).');
  if (!c.idAgenciaIata) out.push('Elige la agencia IATA.');
  if (!c.idDestinoAwb) out.push('Elige el destino de la guía.');
  const usadas = f.lineas.filter((l) => l.idFinca !== null || l.idProducto !== null || l.cajas.trim());
  if (usadas.length === 0) out.push('Agrega al menos una línea de carga.');
  usadas.forEach((l, i) => {
    const n = i + 1;
    if (l.idFinca === null) out.push(`Línea ${n}: falta la finca.`);
    if (l.idProducto === null) out.push(`Línea ${n}: falta el producto.`);
    if (numero(l.cajas) === undefined) out.push(`Línea ${n}: faltan las cajas.`);
    if (numero(l.pesoKg) === undefined) out.push(`Línea ${n}: falta el peso.`);
    if (!l.dae.trim()) out.push(`Línea ${n}: la DAE es obligatoria.`);
  });
  return out;
}

/** Coordinación guardada → formulario (para editar). */
export function desdeDetalle(c: CoordinacionDetalle): FormCoordinar {
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
