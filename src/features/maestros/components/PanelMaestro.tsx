'use client';

import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Drawer,
  IconButton,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { Close as CerrarIcon, EditOutlined as EditarIcon } from '@mui/icons-material';
import { useToast } from '@/shared/providers';
import { getErrorMessage } from '@/shared/utils';
import { useEdicionMaestro, useFormularioMaestro } from '../hooks/useMaestros';
import { maestrosService } from '../services/maestros.service';
import type { FormularioMaestro, ValoresMaestro } from '../types';
import { EditorMaestro } from './EditorMaestro';
import { VistaMaestro } from './VistaMaestro';

const mayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** El nombre del registro: el primer texto del formulario (nombre, nombre de la finca…). */
const nombreDe = (f: FormularioMaestro, v: ValoresMaestro) => {
  const c = f.secciones[0]?.campos.find((x) => x.tipo === 'texto' && x.requerido && !x.soloAlCrear) ??
    f.secciones[0]?.campos.find((x) => x.tipo === 'texto');
  return c && v[c.clave] ? String(v[c.clave]) : null;
};

interface Props {
  entidad: string;
  /** Registro abierto (ver / editar). */
  id: string | null;
  /** Abrir para crear uno nuevo. */
  nuevo: boolean;
  onCerrar: () => void;
  onCreado: (id: number) => void;
  /** Algo se grabó: refrescar la lista. */
  onGuardado: () => void;
}

/**
 * Panel lateral de un dato maestro: la ficha, y desde ahí "Editar"; o el
 * formulario vacío para crear. En modo sombra lo que viene del sistema viejo
 * se ve pero no se edita (se cambia allá y llega solo).
 */
export function PanelMaestro({ entidad, id, nuevo, onCerrar, onCreado, onGuardado }: Props) {
  const abierto = id !== null || nuevo;
  const toast = useToast();
  const { formulario, error: errorFormulario } = useFormularioMaestro(entidad, abierto);
  const { edicion, error: errorEdicion, mutate } = useEdicionMaestro(entidad, id, abierto && !nuevo);
  const [editando, setEditando] = useState(false);
  const [sucio, setSucio] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorServidor, setErrorServidor] = useState<{ mensaje: string; errores?: Record<string, string> } | null>(null);
  const [descartar, setDescartar] = useState<(() => void) | null>(null);

  useEffect(() => {
    setEditando(false);
    setSucio(false);
    setErrorServidor(null);
  }, [id, nuevo]);

  const enFormulario = nuevo || editando;
  /** Antes de salir del formulario con cambios sin grabar, pregunta. */
  const salir = (accion: () => void) => {
    if (enFormulario && sucio) setDescartar(() => accion);
    else accion();
  };
  const terminarEdicion = () => {
    setEditando(false);
    setSucio(false);
    setErrorServidor(null);
  };

  const guardar = async (valores: ValoresMaestro) => {
    if (!formulario) return;
    setGuardando(true);
    setErrorServidor(null);
    try {
      if (nuevo) {
        const r = await maestrosService.crear(entidad, valores);
        toast.success(`${mayuscula(formulario.singular)} ${formulario.femenino ? 'creada' : 'creado'}.`);
        setSucio(false);
        onGuardado();
        onCreado(r.id);
      } else {
        await maestrosService.actualizar(entidad, id!, valores);
        toast.success('Cambios grabados.');
        await mutate();
        onGuardado();
        terminarEdicion();
      }
    } catch (e) {
      const errores = isAxiosError(e) ? (e.response?.data as { errores?: Record<string, string> } | undefined)?.errores : undefined;
      setErrorServidor({ mensaje: getErrorMessage(e, 'No se pudo grabar.'), errores });
    } finally {
      setGuardando(false);
    }
  };

  const singular = formulario?.singular ?? '';
  const nombre = formulario && edicion ? nombreDe(formulario, edicion.valores) : null;
  const titulo = nuevo
    ? `${formulario?.femenino ? 'Nueva' : 'Nuevo'} ${singular}`
    : editando
      ? `Editar ${singular}`
      : (nombre ?? ' ');
  const error = errorFormulario ?? errorEdicion;
  const listo = formulario && (nuevo || edicion);

  return (
    <Drawer
      anchor="right"
      open={abierto}
      onClose={() => salir(onCerrar)}
      PaperProps={{ sx: { width: { xs: '100%', md: 720 }, display: 'flex', flexDirection: 'column' } }}
    >
      <Box sx={{ px: 2.5, pt: 2, pb: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" spacing={1} alignItems="flex-start">
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary">
              {mayuscula(singular)}
              {editando && nombre ? ` · ${nombre}` : ''}
            </Typography>
            <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.3, overflowWrap: 'anywhere' }}>
              {titulo}
            </Typography>
            {!nuevo && edicion && (
              <Chip
                size="small"
                variant="outlined"
                color={edicion.delSistemaViejo ? 'default' : 'primary'}
                label={edicion.delSistemaViejo ? 'Del sistema viejo' : 'Creado en el sistema nuevo'}
                sx={{ mt: 0.75 }}
              />
            )}
          </Box>
          {!enFormulario && edicion?.editable && (
            <Button variant="contained" size="small" startIcon={<EditarIcon />} onClick={() => setEditando(true)}>
              Editar
            </Button>
          )}
          <IconButton onClick={() => salir(onCerrar)} aria-label="Cerrar" size="small">
            <CerrarIcon />
          </IconButton>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, pt: 2 }}>
        {error && <Alert severity="error">{getErrorMessage(error)}</Alert>}
        {!error && !listo && <Skeleton variant="rounded" height={360} />}
        {listo && !enFormulario && edicion && !edicion.editable && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Viene del sistema viejo: mientras se use, se cambia allá y el cambio llega aquí solo.
          </Alert>
        )}
        {listo && nuevo && formulario.modo === 'sombra' && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Se crea solo en el sistema nuevo: el sistema viejo no {formulario.femenino ? 'la' : 'lo'} verá.
          </Alert>
        )}
        {listo && enFormulario && (
          <EditorMaestro
            key={`${id ?? 'nuevo'}-${editando}`}
            formulario={formulario}
            actuales={nuevo ? null : edicion!.valores}
            guardando={guardando}
            errorServidor={errorServidor}
            onGuardar={guardar}
            onCancelar={() => salir(nuevo ? onCerrar : terminarEdicion)}
            onSucio={setSucio}
          />
        )}
        {listo && !enFormulario && edicion && (
          <Box sx={{ pb: 3 }}>
            <VistaMaestro formulario={formulario} valores={edicion.valores} />
          </Box>
        )}
      </Box>

      <Dialog open={descartar !== null} onClose={() => setDescartar(null)}>
        <DialogTitle>¿Descartar los cambios?</DialogTitle>
        <DialogContent>
          <DialogContentText>Lo que cambiaste todavía no se grabó.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDescartar(null)} autoFocus>
            Seguir editando
          </Button>
          <Button
            color="error"
            onClick={() => {
              const accion = descartar;
              setDescartar(null);
              setSucio(false);
              accion?.();
            }}
          >
            Descartar
          </Button>
        </DialogActions>
      </Dialog>
    </Drawer>
  );
}
