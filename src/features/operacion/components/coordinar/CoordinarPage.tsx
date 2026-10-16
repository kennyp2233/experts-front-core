'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { Save as GrabarIcon } from '@mui/icons-material';
import { AppPage } from '@/shared/components/ui';
import { useToast } from '@/shared/providers';
import { formatDate, getErrorMessage } from '@/shared/utils';
import { useCoordinacion } from '../../hooks/useCoordinaciones';
import { operacionService } from '../../services/operacion.service';
import type { Opcion, ParametrosCoordinacion, ValoresLiquidacion } from '../../types/coordinacion';
import { CONCEPTOS_AEROLINEA } from '../../types/coordinacion';
import { formatoAwb, num, plural, usd } from '../../utils/formato';
import { AvisosCoordinacion } from './AvisosCoordinacion';
import { CabeceraCoordinacion } from './CabeceraCoordinacion';
import {
  aDto,
  CabeceraForm,
  desdeDetalle,
  faltantes as calcularFaltantes,
  FormCoordinar,
  formVacio,
  ID_CAMPO,
  LineaForm,
  LiquidacionForm,
  lineaVacia,
  numero,
  prefijoDae,
  recalcularLinea,
  texto,
} from './formulario';
import { LineasEditor } from './LineasEditor';
import { LiquidacionEditor } from './LiquidacionEditor';

/** Campos que trae "Recalcular" (el peso cobrable no: lo da la aerolínea al pesar). */
const CAMPOS_AEROLINEA = new Set<string>(['tarifa', 'iva', 'cargoPca', ...CONCEPTOS_AEROLINEA]);

const nums = { fontVariantNumeric: 'tabular-nums' } as const;

/** Lleva la pantalla hasta un campo y lo deja listo para escribir. */
function irACampo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.focus({ preventScroll: true });
}

/** Un monto de la barra de abajo. */
function Monto({ label, valor, color }: { label: string; valor: string; color?: string }) {
  return (
    <Box sx={{ textAlign: 'right' }}>
      <Typography variant="caption" color="text.secondary" component="div" sx={{ lineHeight: 1.2 }}>
        {label}
      </Typography>
      <Typography variant="subtitle1" fontWeight={700} color={color} sx={{ ...nums, lineHeight: 1.3 }}>
        {valor}
      </Typography>
    </Box>
  );
}

/**
 * Crear o modificar una coordinación del sistema nuevo. Cada cambio se calcula
 * en el servidor (mismas reglas que al grabar): guías hijas, totales y
 * liquidación. Los totales y el botón de grabar quedan fijos abajo.
 */
export function CoordinarPage({ id }: { id?: number }) {
  const router = useRouter();
  const toast = useToast();
  const { coordinacion, error: errorCarga } = useCoordinacion(id ?? null);
  const [form, setForm] = useState<FormCoordinar | null>(id ? null : formVacio());
  const [nombresFinca, setNombresFinca] = useState<Record<number, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [intentoGuardar, setIntentoGuardar] = useState(false);
  /** El usuario cambió algo (para avisar antes de salir sin grabar). */
  const [tocado, setTocado] = useState(false);
  /** Adónde quería ir cuando se le preguntó si sale sin grabar. */
  const [salida, setSalida] = useState<string | null>(null);

  // Al modificar: cargar la coordinación en el formulario una sola vez.
  useEffect(() => {
    if (id && coordinacion && !form) {
      setForm(desdeDetalle(coordinacion));
      setNombresFinca(
        Object.fromEntries(
          coordinacion.guias.filter((g) => g.finca).map((g) => [g.finca!.id, g.finca!.alias || g.finca!.nombre]),
        ),
      );
    }
  }, [id, coordinacion, form]);

  const idAerolinea = form?.cabecera.idAerolinea ?? null;
  const { data: parametros } = useSWR<ParametrosCoordinacion>(
    ['operacion/coordinar/parametros', idAerolinea],
    () => operacionService.parametrosCoordinacion(idAerolinea),
    { revalidateOnFocus: false, keepPreviousData: true },
  );

  // Cálculo en el servidor, 500 ms después del último cambio.
  const dto = useMemo(() => (form ? aDto(form) : null), [form]);
  const dtoJson = dto ? JSON.stringify(dto) : null;
  const [simKey, setSimKey] = useState<string | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setSimKey(dtoJson), 500);
    return () => clearTimeout(t);
  }, [dtoJson]);
  const {
    data: armadaUltima,
    error: errorSim,
    isValidating: simulando,
  } = useSWR(simKey ? ['operacion/coordinar/simular', simKey] : null, () => operacionService.simular(JSON.parse(simKey!), id), {
    keepPreviousData: true,
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });
  // Sin guía, marca o fincas completas no hay nada que mostrar.
  const armada = dto ? armadaUltima : undefined;

  // Mientras no se editen, tarifa y conceptos siguen a la aerolínea y al peso, y el
  // handling al cliente a la ficha del cliente.
  useEffect(() => {
    if (!armadaUltima) return;
    setForm((f) => {
      if (!f || (!f.liqAuto && !f.handlingAuto)) return f;
      const liq = { ...f.liquidacion };
      let cambio = false;
      for (const [k, val] of Object.entries(armadaUltima.sugerida)) {
        const aplica = (f.liqAuto && CAMPOS_AEROLINEA.has(k)) || (f.handlingAuto && k === 'aux3Handling');
        if (!aplica || typeof val !== 'number') continue;
        const t = texto(val, 4);
        if (liq[k as keyof ValoresLiquidacion] !== t) {
          liq[k as keyof ValoresLiquidacion] = t;
          cambio = true;
        }
      }
      return cambio ? { ...f, liquidacion: liq } : f;
    });
  }, [armadaUltima]);

  // Mientras no se edite, el cobro al cliente es el de la última guía de la marca.
  const propuestaCliente = armadaUltima?.sugeridaCliente;
  useEffect(() => {
    setForm((f) => {
      if (!f || !f.clienteAuto) return f;
      const cliente: LiquidacionForm = {};
      for (const [k, v] of Object.entries(propuestaCliente?.valores ?? {})) {
        if (typeof v === 'number') cliente[k as keyof ValoresLiquidacion] = texto(v, 4);
      }
      return JSON.stringify(cliente) === JSON.stringify(f.cliente) ? f : { ...f, cliente };
    });
  }, [propuestaCliente]);

  // Avisar antes de salir con cambios sin grabar: al cerrar o recargar la pestaña, y al
  // hacer clic en cualquier enlace de la app (menú lateral incluido).
  useEffect(() => {
    if (!tocado) return;
    const antesDeCerrar = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    const alClic = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest('a[href]') as HTMLAnchorElement | null;
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      e.preventDefault();
      e.stopPropagation();
      setSalida(url.pathname + url.search);
    };
    window.addEventListener('beforeunload', antesDeCerrar);
    document.addEventListener('click', alClic, true);
    return () => {
      window.removeEventListener('beforeunload', antesDeCerrar);
      document.removeEventListener('click', alClic, true);
    };
  }, [tocado]);

  // ---- cambios (los que hace el usuario marcan el formulario como tocado) ----

  const cambiarCabecera = (cambios: Partial<CabeceraForm>) => {
    setTocado(true);
    setForm((f) => f && { ...f, cabecera: { ...f.cabecera, ...cambios } });
  };

  const alElegirConsignatario = useCallback(
    async (idConsignatario: number | null) => {
      if (!idConsignatario) return;
      try {
        const s = await operacionService.sugerenciaConsignatario(idConsignatario);
        setForm((f) => {
          if (!f) return f;
          const c = { ...f.cabecera };
          // Solo se proponen los campos vacíos.
          const proponer = <K extends keyof CabeceraForm>(k: K, v: CabeceraForm[K] | null | undefined) => {
            if ((c[k] === null || c[k] === '') && v !== null && v !== undefined) c[k] = v;
          };
          proponer('idDestinoFinalDocs', s.idDestinoFinalDocs);
          // Como el viejo: después del consignatario va la aerolínea (la de su última guía).
          if (!c.idGuiaMadre) proponer('idAerolinea', s.ultima?.idAerolinea);
          proponer('idDestinoAwb', s.ultima?.idDestinoAwb);
          proponer('idAgenciaIata', s.ultima?.idAgenciaIata);
          proponer('idTipoEmbarque', s.ultima?.idTipoEmbarque);
          // El pago siempre tiene valor: en una nueva se propone el de la última vez.
          if (!id && s.ultima?.pago) c.pago = s.ultima.pago;
          return { ...f, cabecera: c };
        });
        if (s.ultima) {
          toast.info(`Datos propuestos de la última coordinación de esta marca (${formatDate(s.ultima.fechaVuelo)}). Revísalos.`);
        }
      } catch {
        // Sin sugerencias: no es un error para el usuario.
      }
    },
    [toast, id],
  );

  const cambiarLinea = (key: string, cambios: Partial<LineaForm>, finca?: Opcion | null) => {
    setTocado(true);
    if (finca) setNombresFinca((n) => ({ ...n, [finca.id]: finca.nombre }));
    setForm((f) => {
      if (!f) return f;
      const lineas = f.lineas.map((l) => {
        if (l.key !== key) return l;
        let nueva: LineaForm = { ...l, ...cambios };
        if (finca && 'idFinca' in cambios) {
          // Medidas de la caja de la finca y la DAE que ya tenga en otra fila.
          const m = finca.extra as { largo?: number | null; ancho?: number | null; alto?: number | null } | undefined;
          if (nueva.auto.medidas && m) {
            nueva = { ...nueva, largo: texto(m.largo), ancho: texto(m.ancho), alto: texto(m.alto) };
          }
          const otra = f.lineas.find((x) => x.key !== key && x.idFinca === finca.id && x.dae.trim().length > 12);
          if (otra && nueva.dae.trim().length <= 12) nueva.dae = otra.dae;
        }
        return recalcularLinea(nueva, parametros);
      });
      return { ...f, lineas };
    });
  };

  // DAE del registro (el F2 "Obtiene FUE" del viejo): para cada finca de una fila
  // con la DAE propuesta (no escrita a mano), la vigente para el destino final y
  // la fecha de vuelo. Si cambia la fecha o el destino, se vuelven a proponer.
  const [daesRegistro, setDaesRegistro] = useState<Record<number, { dae: string; hasta: string } | null>>({});
  const idDestinoDae = form ? (form.cabecera.idDestinoFinalDocs ?? form.cabecera.idDestinoAwb) : null;
  const fechaDae = form?.cabecera.fechaVuelo ?? '';
  const fincasDae = form
    ? [...new Set(form.lineas.filter((l) => l.auto.dae && l.idFinca).map((l) => l.idFinca!))].sort((a, b) => a - b).join(',')
    : '';
  useEffect(() => {
    if (!idDestinoDae || !fechaDae || !fincasDae) return;
    let vigente = true;
    const t = setTimeout(async () => {
      try {
        const r = await operacionService.daesVigentes(fincasDae.split(',').map(Number), idDestinoDae, fechaDae);
        if (!vigente) return;
        setDaesRegistro((prev) => ({ ...prev, ...r }));
        setForm((f) => {
          if (!f) return f;
          let cambio = false;
          const lineas = f.lineas.map((l) => {
            const s = l.auto.dae && l.idFinca ? r[l.idFinca] : undefined;
            if (!s || s.dae === l.dae) return l;
            cambio = true;
            return { ...l, dae: s.dae };
          });
          return cambio ? { ...f, lineas } : f;
        });
      } catch {
        // Sin registro: la DAE se escribe a mano, como siempre.
      }
    }, 300);
    return () => {
      vigente = false;
      clearTimeout(t);
    };
  }, [idDestinoDae, fechaDae, fincasDae]);

  /** Fila nueva: copia producto, tipo de caja y el comienzo de la DAE de la última (o duplica una fila). */
  const agregarLinea = (duplicarKey?: string) => {
    setTocado(true);
    // La clave se crea afuera del updater (React puede llamarlo dos veces).
    const nuevaKey = lineaVacia().key;
    setForm((f) => {
      if (!f) return f;
      const base = duplicarKey ? f.lineas.find((l) => l.key === duplicarKey) : undefined;
      const ultima = f.lineas[f.lineas.length - 1];
      const nueva = base
        ? { ...base, key: nuevaKey, idLinea: undefined, registro: undefined, auto: { ...base.auto } }
        : lineaVacia({
            key: nuevaKey,
            ...(ultima ? { idProducto: ultima.idProducto, idTipoCaja: ultima.idTipoCaja, dae: prefijoDae(ultima.dae) } : {}),
          });
      const lineas = [...f.lineas];
      const i = base ? lineas.findIndex((l) => l.key === duplicarKey) + 1 : lineas.length;
      lineas.splice(i, 0, nueva);
      return { ...f, lineas };
    });
    // La fila nueva queda lista para elegir la finca.
    if (!duplicarKey) setTimeout(() => document.getElementById(ID_CAMPO.fila(nuevaKey, 'finca'))?.focus(), 0);
  };

  /**
   * "Ingreso Peso Neto" del sistema viejo: reparte el peso de la báscula entre
   * las filas con cajas, según su peso actual (o sus cajas), en kilos enteros;
   * el resto va a la fila más grande. Devuelve el problema, si lo hay.
   */
  const repartirPeso = (total: number): string | null => {
    if (!form) return null;
    const conCajas = form.lineas.filter((l) => (numero(l.cajas) ?? 0) > 0);
    if (conCajas.length === 0) return 'No hay filas con cajas para repartir el peso.';
    const porKg = conCajas.every((l) => (numero(l.pesoKg) ?? 0) > 0);
    const peso = (l: LineaForm) => (porKg ? numero(l.pesoKg)! : numero(l.cajas)!);
    const suma = conCajas.reduce((a, l) => a + peso(l), 0);
    const reparto = new Map(conCajas.map((l) => [l.key, Math.floor((total * peso(l)) / suma)]));
    const resto = Math.round(total) - [...reparto.values()].reduce((a, b) => a + b, 0);
    const mayor = conCajas.reduce((a, l) => (peso(l) > peso(a) ? l : a));
    reparto.set(mayor.key, reparto.get(mayor.key)! + resto);
    if ([...reparto.values()].some((kg) => kg <= 0)) {
      return 'Con ese peso alguna finca queda en 0 kg: realiza el ajuste de pesos manualmente.';
    }
    setTocado(true);
    setForm(
      (f) =>
        f && {
          ...f,
          lineas: f.lineas.map((l) =>
            reparto.has(l.key) ? recalcularLinea({ ...l, pesoKg: texto(reparto.get(l.key)!, 0), auto: { ...l.auto, pesoKg: false } }, parametros) : l,
          ),
        },
    );
    return null;
  };

  const quitarLinea = (key: string) => {
    setTocado(true);
    setForm((f) => f && { ...f, lineas: f.lineas.filter((l) => l.key !== key) });
  };

  const cambiarLiquidacion = (campo: keyof ValoresLiquidacion, valor: string) => {
    setTocado(true);
    setForm(
      (f) =>
        f && {
          ...f,
          liquidacion: { ...f.liquidacion, [campo]: valor },
          liqAuto: CAMPOS_AEROLINEA.has(campo) ? false : f.liqAuto,
          handlingAuto: campo === 'aux3Handling' ? false : f.handlingAuto,
        },
    );
  };

  const cambiarCliente = (campo: keyof ValoresLiquidacion, valor: string) => {
    setTocado(true);
    setForm((f) => f && { ...f, cliente: { ...f.cliente, [campo]: valor }, clienteAuto: false });
  };

  const recalcular = () => {
    setTocado(true);
    setForm((f) => {
      if (!f || !armadaUltima) return f;
      const liq = { ...f.liquidacion };
      for (const k of CAMPOS_AEROLINEA) delete liq[k as keyof ValoresLiquidacion];
      for (const [k, val] of Object.entries(armadaUltima.sugerida)) {
        if (CAMPOS_AEROLINEA.has(k) && typeof val === 'number') liq[k as keyof ValoresLiquidacion] = texto(val, 4);
      }
      return { ...f, liquidacion: liq, liqAuto: true };
    });
  };

  // Al elegir la aerolínea (sin guía todavía) se propone su primera guía libre: la virtual
  // de menor número y, si no hay, la normal más antigua (Proc_6FFB80 del sistema viejo).
  // Una sola vez por aerolínea: si después borra la guía para buscar otra, no se vuelve a proponer.
  const aerolineaSinGuia = !id && form?.cabecera.idAerolinea && !form.cabecera.idGuiaMadre ? form.cabecera.idAerolinea : null;
  const guiaPropuestaPara = useRef<number | null>(null);
  useEffect(() => {
    if (!aerolineaSinGuia || guiaPropuestaPara.current === aerolineaSinGuia) return;
    guiaPropuestaPara.current = aerolineaSinGuia;
    let vigente = true;
    operacionService
      .opciones('guias', '', undefined, aerolineaSinGuia, 1)
      .then((ops) => {
        const g = ops[0];
        if (!vigente || !g) return;
        setForm((f) =>
          f && !f.cabecera.idGuiaMadre && f.cabecera.idAerolinea === aerolineaSinGuia
            ? { ...f, cabecera: { ...f.cabecera, idGuiaMadre: g.id } }
            : f,
        );
      })
      .catch(() => undefined);
    return () => {
      vigente = false;
    };
  }, [aerolineaSinGuia]);

  // Las filas recalculan sus valores sugeridos cuando llegan los parámetros.
  useEffect(() => {
    if (parametros) setForm((f) => f && { ...f, lineas: f.lineas.map((l) => recalcularLinea(l, parametros)) });
  }, [parametros]);

  // ---- grabar ----

  const faltantes = form ? calcularFaltantes(form, nombresFinca) : [];
  const errores = new Set(intentoGuardar ? faltantes.map((f) => f.campo) : []);
  const errorSimulacion = dto && errorSim ? getErrorMessage(errorSim) : null;
  // La DAE incompleta ya se marca en su fila; no se repite como advertencia.
  const advertencias = (armada?.advertencias ?? []).filter((a) => !a.includes('"-"') && !a.includes('no tiene el formato'));

  const grabar = async (otra = false) => {
    setIntentoGuardar(true);
    if (!form) return;
    if (faltantes.length > 0) {
      toast.warning(
        faltantes.length === 1
          ? `Falta un dato para grabar: ${faltantes[0].mensaje}`
          : `Faltan ${faltantes.length} datos para grabar. El primero: ${faltantes[0].mensaje}`,
      );
      irACampo(faltantes[0].campo);
      return;
    }
    if (!dto) return;
    setGuardando(true);
    try {
      const r = id ? await operacionService.actualizarCoordinacion(id, dto) : await operacionService.crearCoordinacion(dto);
      setTocado(false);
      toast.success(`Coordinación N° ${r.id} grabada. Queda abierta hasta el corte.`);
      if (otra) {
        // "Grabar y nueva": otra coordinación del mismo día de vuelo.
        const vacio = formVacio();
        setForm({ ...vacio, cabecera: { ...vacio.cabecera, fechaVuelo: form.cabecera.fechaVuelo } });
        setNombresFinca({});
        setIntentoGuardar(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        router.push(`/operacion/coordinaciones/${r.id}`);
      }
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setGuardando(false);
    }
  };

  const volver = id ? `/operacion/coordinaciones/${id}` : '/operacion/coordinaciones';
  const cancelar = () => (tocado ? setSalida(volver) : router.push(volver));
  const salirSinGrabar = () => {
    const destino = salida;
    setTocado(false);
    setSalida(null);
    if (destino) router.push(destino);
  };

  // ---- render ----

  if (id && errorCarga) {
    return (
      <AppPage title="Modificar coordinación">
        <Alert severity="error">{getErrorMessage(errorCarga)}</Alert>
      </AppPage>
    );
  }
  if (!form) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (id && coordinacion && (coordinacion.origen === 'ACCESS' || coordinacion.estado !== 'BORRADOR')) {
    return (
      <AppPage title="Modificar coordinación">
        <Alert severity="info">
          {coordinacion.origen === 'ACCESS'
            ? 'Esta coordinación viene del sistema viejo: mientras se usen los dos sistemas, se modifica allá.'
            : 'Solo se modifica una coordinación abierta (antes del corte).'}{' '}
          <Link href={`/operacion/coordinaciones/${id}`}>Volver al detalle</Link>
        </Alert>
      </AppPage>
    );
  }

  const t = armada?.totales;
  const errorPesoCobrable = errorSimulacion && /peso cobrable/i.test(errorSimulacion) ? errorSimulacion : null;

  return (
    <AppPage
      title={id ? `Modificar coordinación N° ${id} · guía ${formatoAwb(coordinacion?.numeroGuia)}` : 'Nueva coordinación'}
      actions={<Button onClick={cancelar}>Cancelar</Button>}
    >
      <Stack spacing={2} sx={{ pb: 12 }}>
        {!id && (
          <Alert severity="info" variant="outlined">
            Las fincas todavía cargan su detalle por la web del sistema viejo: en una coordinación nueva, el detalle se
            escribe aquí.
          </Alert>
        )}
        <CabeceraCoordinacion
          valor={form.cabecera}
          onChange={cambiarCabecera}
          onConsignatario={alElegirConsignatario}
          errores={errores}
        />

        <AvisosCoordinacion
          error={errorSimulacion}
          faltantes={intentoGuardar ? faltantes : []}
          advertencias={advertencias}
          onIr={irACampo}
        />

        <LineasEditor
          lineas={form.lineas}
          parametros={parametros}
          armada={armada}
          onCambiar={cambiarLinea}
          onAgregar={agregarLinea}
          onQuitar={quitarLinea}
          onRepartirPeso={repartirPeso}
          errores={errores}
          daesRegistro={daesRegistro}
        />

        <LiquidacionEditor
          aerolinea={form.liquidacion}
          onAerolinea={cambiarLiquidacion}
          cliente={form.cliente}
          onCliente={cambiarCliente}
          conCliente={form.conCliente}
          onConCliente={(v) => {
            setTocado(true);
            setForm((f) => f && { ...f, conCliente: v });
          }}
          parametros={parametros}
          resumenAerolinea={armada?.aerolinea}
          resumenCliente={armada?.cliente}
          diferencia={armada?.diferencia}
          pesoBruto={armada?.totales.kgs}
          onSugerir={armadaUltima ? recalcular : undefined}
          liqAuto={form.liqAuto}
          handlingAuto={form.handlingAuto}
          clienteAuto={form.clienteAuto}
          propuestaCliente={form.clienteAuto ? propuestaCliente?.desde : undefined}
          errorPesoCobrable={errorPesoCobrable}
        />
      </Stack>

      {/* Barra fija a todo el ancho (desde el borde del menú): totales, montos y grabar. */}
      <Paper
        square
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 'var(--ancho-menu, 0px)',
          right: 0,
          px: { xs: 2, md: 3 },
          py: 1,
          zIndex: (th) => th.zIndex.appBar,
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        {simulando && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2 }} />}
        <Stack direction="row" spacing={3} alignItems="center" useFlexGap flexWrap="wrap">
          <Typography variant="body2" color="text.secondary" sx={{ ...nums, flex: 1, minWidth: 220 }}>
            {t ? (
              <>
                <strong>{plural(armada!.guiasHijas.length, 'guía hija', 'guías hijas')}</strong> · {num(t.fulls, 4)} fulls ·{' '}
                {num(t.cajas, 0)} cajas · {num(t.kgs)} kg · {num(t.volumen)} kg vol.
              </>
            ) : (
              'Elige la guía, el consignatario y al menos una finca para ver los totales.'
            )}
          </Typography>
          {form.conCliente ? (
            <>
              <Monto label="Cobro al cliente" valor={usd(armada?.cliente?.total)} />
              <Monto label="Guía madre" valor={usd(armada?.aerolinea.total)} />
              {armada?.diferencia?.total !== null && armada?.diferencia?.total !== undefined && (
                <Monto
                  label="Ganancia"
                  valor={usd(armada.diferencia.total)}
                  color={armada.diferencia.total < 0 ? 'error.main' : 'success.main'}
                />
              )}
            </>
          ) : (
            <Monto label="Total guía madre" valor={usd(armada?.aerolinea.total)} />
          )}
          {intentoGuardar && faltantes.length > 0 && (
            <Chip
              color="warning"
              label={faltantes.length === 1 ? 'Falta 1 dato' : `Faltan ${faltantes.length} datos`}
              onClick={() => irACampo(faltantes[0].campo)}
            />
          )}
          <Stack direction="row" spacing={1}>
            {!id && (
              <Button variant="outlined" disabled={guardando} onClick={() => grabar(true)}>
                Grabar y nueva
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={guardando ? <CircularProgress size={16} color="inherit" /> : <GrabarIcon />}
              disabled={guardando}
              onClick={() => grabar()}
            >
              Grabar
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Dialog open={salida !== null} onClose={() => setSalida(null)} maxWidth="xs" fullWidth>
        <DialogTitle>¿Salir sin grabar?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Lo que cambiaste en esta coordinación se pierde.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSalida(null)} variant="contained">
            Seguir aquí
          </Button>
          <Button color="error" onClick={salirSinGrabar}>
            Salir sin grabar
          </Button>
        </DialogActions>
      </Dialog>
    </AppPage>
  );
}
