'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Alert, Box, Button, CircularProgress, Grid, Paper, Stack, Typography } from '@mui/material';
import { ArrowBack as VolverIcon, Save as GuardarIcon } from '@mui/icons-material';
import { AppPage } from '@/shared/components/ui';
import { useToast } from '@/shared/providers';
import { getErrorMessage } from '@/shared/utils';
import { useCoordinacion } from '../../hooks/useCoordinaciones';
import { operacionService } from '../../services/operacion.service';
import type { Opcion, ParametrosCoordinacion, ValoresLiquidacion } from '../../types/coordinacion';
import { CONCEPTOS_AEROLINEA } from '../../types/coordinacion';
import { usd } from '../../utils/formato';
import { CabeceraCoordinacion } from './CabeceraCoordinacion';
import {
  aDto,
  CabeceraForm,
  desdeDetalle,
  faltantes as calcularFaltantes,
  FormCoordinar,
  formVacio,
  lineaCompleta,
  LineaForm,
  lineaVacia,
  numero,
  recalcularLinea,
  texto,
} from './formulario';
import { LineasEditor } from './LineasEditor';
import { LiquidacionEditor } from './LiquidacionEditor';
import { VistaPrevia } from './VistaPrevia';

/** Campos que trae "valores de la aerolínea" (el peso cobrable no). */
const CAMPOS_AEROLINEA = new Set<string>(['tarifa', 'iva', 'cargoPca', ...CONCEPTOS_AEROLINEA]);

/** Peso cobrable sugerido = peso bruto redondeado arriba (el usuario lo corrige). */
function aplicarCw(f: FormCoordinar): FormCoordinar {
  if (!f.cwAuto) return f;
  const kg = f.lineas.filter(lineaCompleta).reduce((a, l) => a + (numero(l.pesoKg) ?? 0), 0);
  const cw = kg > 0 ? String(Math.ceil(kg - 1e-9)) : '';
  return f.liquidacion.pesoCobrable === cw ? f : { ...f, liquidacion: { ...f.liquidacion, pesoCobrable: cw } };
}

/**
 * Crear o editar una coordinación del sistema nuevo. Cada cambio se simula en
 * el servidor (mismas reglas que al guardar) y se muestra el resultado: guías
 * hijas, totales y liquidación.
 */
export function CoordinarPage({ id }: { id?: number }) {
  const router = useRouter();
  const toast = useToast();
  const { coordinacion, error: errorCarga } = useCoordinacion(id ?? null);
  const [form, setForm] = useState<FormCoordinar | null>(id ? null : formVacio());
  const [nombresFinca, setNombresFinca] = useState<Record<number, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [intentoGuardar, setIntentoGuardar] = useState(false);

  // Al editar: cargar la coordinación en el formulario una sola vez.
  useEffect(() => {
    if (id && coordinacion && !form) {
      setForm(desdeDetalle(coordinacion));
      setNombresFinca(
        Object.fromEntries(coordinacion.guias.filter((g) => g.finca).map((g) => [g.finca!.id, g.finca!.nombre])),
      );
    }
  }, [id, coordinacion, form]);

  const idAerolinea = form?.cabecera.idAerolinea ?? null;
  const { data: parametros } = useSWR<ParametrosCoordinacion>(
    ['operacion/coordinar/parametros', idAerolinea],
    () => operacionService.parametrosCoordinacion(idAerolinea),
    { revalidateOnFocus: false, keepPreviousData: true },
  );

  // Simulación en el servidor, 500 ms después del último cambio.
  const dto = useMemo(() => (form ? aDto(form) : null), [form]);
  const dtoJson = dto ? JSON.stringify(dto) : null;
  const [simKey, setSimKey] = useState<string | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setSimKey(dtoJson), 500);
    return () => clearTimeout(t);
  }, [dtoJson]);
  const {
    data: armada,
    error: errorSim,
    isValidating: simulando,
  } = useSWR(simKey ? ['operacion/coordinar/simular', simKey] : null, () => operacionService.simular(JSON.parse(simKey!), id), {
    keepPreviousData: true,
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  // Mientras no se editen, tarifa y conceptos siguen a la aerolínea y al peso.
  useEffect(() => {
    if (!armada) return;
    setForm((f) => {
      if (!f || !f.liqAuto) return f;
      const liq = { ...f.liquidacion };
      let cambio = false;
      for (const [k, val] of Object.entries(armada.sugerida)) {
        if (!CAMPOS_AEROLINEA.has(k) || typeof val !== 'number') continue;
        const t = texto(val, 4);
        if (liq[k as keyof ValoresLiquidacion] !== t) {
          liq[k as keyof ValoresLiquidacion] = t;
          cambio = true;
        }
      }
      return cambio ? { ...f, liquidacion: liq } : f;
    });
  }, [armada]);

  // ---- cambios ----

  const cambiarCabecera = (cambios: Partial<CabeceraForm>) =>
    setForm((f) => f && { ...f, cabecera: { ...f.cabecera, ...cambios } });

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
          proponer('idDestinoAwb', s.ultima?.idDestinoAwb);
          proponer('idAgenciaIata', s.ultima?.idAgenciaIata);
          proponer('idTipoEmbarque', s.ultima?.idTipoEmbarque);
          return { ...f, cabecera: c };
        });
        if (s.ultima) toast.info(`Datos propuestos de la última coordinación de esta marca (${s.ultima.fechaVuelo}). Revísalos.`);
      } catch {
        // Sin sugerencias: no es un error para el usuario.
      }
    },
    [toast],
  );

  const cambiarLinea = (key: string, cambios: Partial<LineaForm>, finca?: Opcion | null) => {
    if (finca) setNombresFinca((n) => ({ ...n, [finca.id]: finca.nombre }));
    setForm((f) => {
      if (!f) return f;
      const lineas = f.lineas.map((l) => {
        if (l.key !== key) return l;
        let nueva: LineaForm = { ...l, ...cambios };
        if (finca && 'idFinca' in cambios) {
          // Medidas de la caja de la finca y la DAE que ya tenga en otra línea.
          const m = finca.extra as { largo?: number | null; ancho?: number | null; alto?: number | null } | undefined;
          if (nueva.auto.medidas && m) {
            nueva = { ...nueva, largo: texto(m.largo), ancho: texto(m.ancho), alto: texto(m.alto) };
          }
          const otra = f.lineas.find((x) => x.key !== key && x.idFinca === finca.id && x.dae.trim());
          if (!nueva.dae.trim() && otra) nueva.dae = otra.dae;
        }
        return recalcularLinea(nueva, parametros);
      });
      return aplicarCw({ ...f, lineas });
    });
  };

  const agregarLinea = (duplicarKey?: string) =>
    setForm((f) => {
      if (!f) return f;
      const base = duplicarKey ? f.lineas.find((l) => l.key === duplicarKey) : undefined;
      const nueva = base ? { ...base, key: lineaVacia().key, auto: { ...base.auto } } : lineaVacia();
      const lineas = [...f.lineas];
      const i = base ? lineas.findIndex((l) => l.key === duplicarKey) + 1 : lineas.length;
      lineas.splice(i, 0, nueva);
      return aplicarCw({ ...f, lineas });
    });

  const quitarLinea = (key: string) =>
    setForm((f) => f && aplicarCw({ ...f, lineas: f.lineas.filter((l) => l.key !== key) }));

  const cambiarLiquidacion = (campo: keyof ValoresLiquidacion, valor: string) =>
    setForm(
      (f) =>
        f && {
          ...f,
          liquidacion: { ...f.liquidacion, [campo]: valor },
          liqAuto: CAMPOS_AEROLINEA.has(campo) ? false : f.liqAuto,
          cwAuto: campo === 'pesoCobrable' ? false : f.cwAuto,
        },
    );

  const usarValoresAerolinea = () =>
    setForm((f) => {
      if (!f || !armada) return f;
      const liq = { ...f.liquidacion };
      for (const k of CAMPOS_AEROLINEA) delete liq[k as keyof ValoresLiquidacion];
      for (const [k, val] of Object.entries(armada.sugerida)) {
        if (CAMPOS_AEROLINEA.has(k) && typeof val === 'number') liq[k as keyof ValoresLiquidacion] = texto(val, 4);
      }
      return { ...f, liquidacion: liq, liqAuto: true };
    });

  // Las líneas recalculan sus defaults cuando llegan los parámetros.
  useEffect(() => {
    if (parametros) setForm((f) => f && { ...f, lineas: f.lineas.map((l) => recalcularLinea(l, parametros)) });
  }, [parametros]);

  // ---- guardar ----

  const faltantes = form ? calcularFaltantes(form) : [];
  const errorSimulacion = errorSim ? getErrorMessage(errorSim) : null;

  const guardar = async () => {
    setIntentoGuardar(true);
    if (!form || faltantes.length > 0 || !dto) return;
    setGuardando(true);
    try {
      const r = id ? await operacionService.actualizarCoordinacion(id, dto) : await operacionService.crearCoordinacion(dto);
      toast.success(id ? 'Coordinación actualizada.' : 'Coordinación creada: queda abierta hasta el corte.');
      router.push(`/operacion/coordinaciones/${r.id}`);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setGuardando(false);
    }
  };

  // ---- render ----

  if (id && errorCarga) {
    return (
      <AppPage title="Editar coordinación">
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
      <AppPage title="Editar coordinación">
        <Alert severity="info">
          {coordinacion.origen === 'ACCESS'
            ? 'Esta coordinación viene del sistema viejo: mientras se usen los dos sistemas, se modifica allá.'
            : 'Solo se modifica una coordinación abierta (antes del corte).'}{' '}
          <Link href={`/operacion/coordinaciones/${id}`}>Volver al detalle</Link>
        </Alert>
      </AppPage>
    );
  }

  const volver = id ? `/operacion/coordinaciones/${id}` : '/operacion/coordinaciones';

  return (
    <AppPage
      title={id ? `Editar coordinación ${coordinacion?.numeroGuia ?? ''}` : 'Nueva coordinación'}
      subtitle="Guía, carga por finca y liquidación. La vista previa se calcula con las mismas reglas que al guardar."
      actions={
        <Button component={Link} href={volver} startIcon={<VolverIcon />}>
          {id ? 'Detalle' : 'Coordinaciones'}
        </Button>
      }
    >
      <Stack spacing={2} sx={{ pb: 10 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, lg: 7 }}>
            <CabeceraCoordinacion valor={form.cabecera} onChange={cambiarCabecera} onConsignatario={alElegirConsignatario} />
          </Grid>
          <Grid size={{ xs: 12, lg: 5 }}>
            <VistaPrevia
              armada={dto ? armada : undefined}
              calculando={simulando}
              error={dto ? errorSimulacion : null}
              faltantes={intentoGuardar ? faltantes : []}
              nombresFinca={nombresFinca}
            />
          </Grid>
        </Grid>

        <LineasEditor
          lineas={form.lineas}
          parametros={parametros}
          onCambiar={cambiarLinea}
          onAgregar={agregarLinea}
          onQuitar={quitarLinea}
        />

        <LiquidacionEditor
          valores={form.liquidacion}
          onChange={cambiarLiquidacion}
          parametros={parametros}
          resumen={dto ? armada?.liquidacion : undefined}
          pesoBruto={armada?.totales.kgs}
          onSugerir={armada ? usarValoresAerolinea : undefined}
          liqAuto={form.liqAuto}
          cwAuto={form.cwAuto}
        />
      </Stack>

      {/* Barra fija con el total y la acción principal. */}
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 24,
          left: { xs: 16, md: 'auto' },
          px: 2,
          py: 1.25,
          borderRadius: 2,
          zIndex: (t) => t.zIndex.appBar,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="caption" color="text.secondary" component="div">
              Total guía
            </Typography>
            <Typography variant="subtitle1" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>
              {usd(dto ? armada?.liquidacion.total : null)}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={guardando ? <CircularProgress size={16} color="inherit" /> : <GuardarIcon />}
            disabled={guardando}
            onClick={guardar}
          >
            {id ? 'Guardar cambios' : 'Crear coordinación'}
          </Button>
        </Stack>
      </Paper>
    </AppPage>
  );
}
