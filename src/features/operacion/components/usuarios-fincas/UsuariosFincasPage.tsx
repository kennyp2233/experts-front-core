'use client';

import { useState } from 'react';
import useSWR from 'swr';
import {
  Alert,
  Autocomplete,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  ContentCopy as CopiarIcon,
  Edit as EditarIcon,
  Key as ClaveIcon,
  PersonOff as DesactivarIcon,
  Person as ActivarIcon,
} from '@mui/icons-material';
import api from '@/shared/services/api';
import { AppPage, DataTable, type DataTableColumn } from '@/shared/components/ui';
import { useToast } from '@/shared/providers';
import { formatDate, getErrorMessage } from '@/shared/utils';
import { operacionService } from '../../services/operacion.service';
import type { Opcion } from '../../types/coordinacion';

interface UsuarioFinca {
  id: string;
  usuario: string;
  nombre: string;
  email: string | null;
  activo: boolean;
  fincas: Array<{ id: number; nombre: string }>;
  creado: string;
}

const servicio = {
  listar: async (): Promise<UsuarioFinca[]> => (await api.get('/operacion/usuarios-fincas')).data,
  crear: async (d: { usuario: string; nombre: string; email?: string; fincas: number[] }) =>
    (await api.post('/operacion/usuarios-fincas', d)).data as { id: string; usuario: string; clave: string },
  actualizar: async (id: string, d: { nombre?: string; fincas?: number[]; activo?: boolean }) =>
    (await api.put(`/operacion/usuarios-fincas/${id}`, d)).data,
  clave: async (id: string) => (await api.post(`/operacion/usuarios-fincas/${id}/clave`)).data as { usuario: string; clave: string },
};

/** Buscador de fincas, varias a la vez (un usuario puede cargar para varias, como en la web vieja). */
function FincasMulti({ value, onChange }: { value: Opcion[]; onChange: (v: Opcion[]) => void }) {
  const [texto, setTexto] = useState('');
  const { data: opciones, isLoading } = useSWR(['usuarios-fincas/fincas', texto], () => operacionService.opciones('fincas', texto), {
    keepPreviousData: true,
  });
  return (
    <Autocomplete
      multiple
      options={opciones ?? []}
      value={value}
      loading={isLoading}
      filterOptions={(x) => x}
      getOptionLabel={(o) => o.nombre}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      onChange={(_, v) => onChange(v)}
      onInputChange={(_, v, r) => r === 'input' && setTexto(v)}
      renderInput={(p) => <TextField {...p} label="Fincas" placeholder="Busca por nombre o RUC" />}
    />
  );
}

/**
 * Usuarios de las fincas (como "WEB Usuarios" del sistema viejo): con ellos
 * entran al portal a cargar su detalle y sus DAE. La clave se genera y se
 * muestra una sola vez.
 */
export function UsuariosFincasPage() {
  const toast = useToast();
  const { data, error, isLoading, mutate } = useSWR('operacion/usuarios-fincas', servicio.listar);
  const [editando, setEditando] = useState<UsuarioFinca | 'nuevo' | null>(null);
  const [form, setForm] = useState({ usuario: '', nombre: '', email: '', fincas: [] as Opcion[] });
  const [clave, setClave] = useState<{ usuario: string; clave: string } | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  const abrir = (u: UsuarioFinca | 'nuevo') => {
    setErrorForm(null);
    setEditando(u);
    setForm(
      u === 'nuevo'
        ? { usuario: '', nombre: '', email: '', fincas: [] }
        : {
            usuario: u.usuario,
            nombre: u.nombre,
            email: u.email ?? '',
            fincas: u.fincas.map((f) => ({ id: f.id, nombre: f.nombre, codigo: null, detalle: null })),
          },
    );
  };

  const guardar = async () => {
    if (!editando) return;
    setTrabajando(true);
    setErrorForm(null);
    try {
      if (editando === 'nuevo') {
        const r = await servicio.crear({
          usuario: form.usuario.trim(),
          nombre: form.nombre.trim(),
          email: form.email.trim() || undefined,
          fincas: form.fincas.map((f) => f.id),
        });
        setClave({ usuario: r.usuario, clave: r.clave });
      } else {
        await servicio.actualizar(editando.id, { nombre: form.nombre.trim(), fincas: form.fincas.map((f) => f.id) });
        toast.success('Usuario actualizado.');
      }
      setEditando(null);
      mutate();
    } catch (e) {
      setErrorForm(getErrorMessage(e, 'No se pudo grabar.'));
    } finally {
      setTrabajando(false);
    }
  };

  const nuevaClave = async (u: UsuarioFinca) => {
    try {
      setClave(await servicio.clave(u.id));
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const activar = async (u: UsuarioFinca) => {
    try {
      await servicio.actualizar(u.id, { activo: !u.activo });
      toast.success(u.activo ? `${u.usuario} ya no puede entrar.` : `${u.usuario} puede entrar de nuevo.`);
      mutate();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const columnas: DataTableColumn<UsuarioFinca>[] = [
    { key: 'usuario', label: 'Usuario', pinned: true, mobile: 'title', value: (u) => u.usuario },
    { key: 'nombre', label: 'Nombre', value: (u) => u.nombre, mobile: 'subtitle' },
    { key: 'fincas', label: 'Fincas', value: (u) => u.fincas.map((f) => f.nombre).join(', '), maxWidth: 360 },
    {
      key: 'estado',
      label: 'Estado',
      value: (u) => (u.activo ? 'Activo' : 'Sin acceso'),
      render: (u) => <Chip size="small" variant="outlined" color={u.activo ? 'success' : 'default'} label={u.activo ? 'Activo' : 'Sin acceso'} />,
    },
    { key: 'creado', label: 'Creado', value: (u) => formatDate(u.creado), defaultHidden: true },
  ];

  const titulo = editando === 'nuevo' ? 'Nuevo usuario de finca' : editando ? `Usuario ${editando.usuario}` : '';
  const valido = form.nombre.trim().length >= 2 && form.fincas.length > 0 && (editando !== 'nuevo' || /^[A-Za-z0-9._-]{3,30}$/.test(form.usuario.trim()));
  const portal = typeof window !== 'undefined' ? `${window.location.origin}/auth` : '';

  return (
    <AppPage
      title="Usuarios de fincas"
      subtitle="Con estos usuarios las fincas entran al portal a cargar su detalle en las guías y sus DAE."
      actions={
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => abrir('nuevo')}>
          Nuevo usuario
        </Button>
      }
    >
      <DataTable
        id="operacion-usuarios-fincas"
        columns={columnas}
        rows={data ?? []}
        getRowId={(u) => u.id}
        loading={isLoading}
        error={error}
        onRetry={() => mutate()}
        onRefresh={() => mutate()}
        searchable
        searchPlaceholder="Usuario, nombre o finca"
        emptyMessage="Todavía no hay usuarios de finca."
        dense
        actions={[
          { label: 'Editar', icon: <EditarIcon fontSize="small" />, onClick: abrir },
          { label: 'Clave nueva', icon: <ClaveIcon fontSize="small" />, onClick: nuevaClave },
          { label: 'Quitar acceso', icon: <DesactivarIcon fontSize="small" />, onClick: activar, color: 'error', hidden: (u) => !u.activo },
          { label: 'Dar acceso', icon: <ActivarIcon fontSize="small" />, onClick: activar, hidden: (u) => u.activo },
        ]}
      />

      <Dialog open={editando !== null} onClose={() => setEditando(null)} fullWidth maxWidth="sm">
        <DialogTitle>{titulo}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {editando === 'nuevo' && (
              <TextField
                label="Usuario"
                value={form.usuario}
                onChange={(e) => setForm((f) => ({ ...f, usuario: e.target.value.toUpperCase().replace(/\s/g, '') }))}
                helperText="Sin espacios, como en la web vieja (p. ej. MYSTIC). Con este entra la finca."
                autoFocus
              />
            )}
            <TextField label="Nombre" value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
            {editando === 'nuevo' && (
              <TextField
                label="Correo (opcional)"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            )}
            <FincasMulti value={form.fincas} onChange={(v) => setForm((f) => ({ ...f, fincas: v }))} />
            {errorForm && <Alert severity="error">{errorForm}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditando(null)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={guardar}
            disabled={!valido || trabajando}
            startIcon={trabajando ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {editando === 'nuevo' ? 'Crear y ver la clave' : 'Grabar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={clave !== null} onClose={() => setClave(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Clave de {clave?.usuario}</DialogTitle>
        <DialogContent>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ my: 1 }}>
            <Typography variant="h5" sx={{ fontFamily: 'monospace', letterSpacing: 2 }}>
              {clave?.clave}
            </Typography>
            <Tooltip title="Copiar usuario y clave">
              <IconButton
                onClick={async () => {
                  await navigator.clipboard.writeText(`Usuario: ${clave?.usuario}\nClave: ${clave?.clave}\nEntrar en: ${portal}`);
                  toast.success('Copiado.');
                }}
              >
                <CopiarIcon />
              </IconButton>
            </Tooltip>
          </Stack>
          <Alert severity="warning">Mándasela ahora a la finca: no se vuelve a mostrar. Si la pierden, genera una nueva.</Alert>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Entran en {portal}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setClave(null)}>
            Listo
          </Button>
        </DialogActions>
      </Dialog>
    </AppPage>
  );
}
