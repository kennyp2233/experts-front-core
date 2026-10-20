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
import { AppPage, DataTable, type DataTableColumn } from '@/shared/components/ui';
import { useToast } from '@/shared/providers';
import { formatDate, getErrorMessage } from '@/shared/utils';
import { type ClienteOpcion, type UsuarioCliente, usuariosClientesService as servicio } from '../../services/usuarios-clientes.service';

/** Buscador de clientes, varios a la vez (un usuario puede ver las guías de varios clientes). */
function ClientesMulti({ value, onChange }: { value: ClienteOpcion[]; onChange: (v: ClienteOpcion[]) => void }) {
  const [texto, setTexto] = useState('');
  const { data: opciones, isLoading } = useSWR(['usuarios-clientes/clientes', texto], () => servicio.buscarClientes(texto), {
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
      renderOption={(props, o) => {
        const { key, ...resto } = props;
        return (
          <li key={key} {...resto}>
            <Stack>
              <Typography variant="body2">{o.nombre}</Typography>
              {o.detalle && o.detalle !== o.nombre && (
                <Typography variant="caption" color="text.secondary">
                  {o.detalle}
                </Typography>
              )}
            </Stack>
          </li>
        );
      }}
      renderInput={(p) => <TextField {...p} label="Clientes que ve" placeholder="Busca por nombre" />}
    />
  );
}

/**
 * Usuarios de los clientes: con ellos entran al portal de clientes a ver sus
 * guías, lo que se les cobra y su estado de cuenta. La clave se genera y se
 * muestra una sola vez.
 */
export function UsuariosClientesPage() {
  const toast = useToast();
  const { data, error, isLoading, mutate } = useSWR('operacion/usuarios-clientes', servicio.listar);
  const [editando, setEditando] = useState<UsuarioCliente | 'nuevo' | null>(null);
  const [form, setForm] = useState({ usuario: '', nombre: '', email: '', clientes: [] as ClienteOpcion[] });
  const [clave, setClave] = useState<{ usuario: string; clave: string } | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  const abrir = (u: UsuarioCliente | 'nuevo') => {
    setErrorForm(null);
    setEditando(u);
    setForm(
      u === 'nuevo'
        ? { usuario: '', nombre: '', email: '', clientes: [] }
        : {
            usuario: u.usuario,
            nombre: u.nombre,
            email: u.email ?? '',
            clientes: u.clientes.map((c) => ({ id: c.id, nombre: c.nombre, codigo: null, detalle: null })),
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
          clientes: form.clientes.map((c) => c.id),
        });
        setClave({ usuario: r.usuario, clave: r.clave });
      } else {
        await servicio.actualizar(editando.id, { nombre: form.nombre.trim(), clientes: form.clientes.map((c) => c.id) });
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

  const nuevaClave = async (u: UsuarioCliente) => {
    try {
      setClave(await servicio.clave(u.id));
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const activar = async (u: UsuarioCliente) => {
    try {
      await servicio.actualizar(u.id, { activo: !u.activo });
      toast.success(u.activo ? `${u.usuario} ya no puede entrar.` : `${u.usuario} puede entrar de nuevo.`);
      mutate();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const columnas: DataTableColumn<UsuarioCliente>[] = [
    { key: 'usuario', label: 'Usuario', pinned: true, mobile: 'title', value: (u) => u.usuario },
    { key: 'nombre', label: 'Nombre', value: (u) => u.nombre, mobile: 'subtitle' },
    { key: 'clientes', label: 'Clientes', value: (u) => u.clientes.map((c) => c.nombre).join(', '), maxWidth: 360 },
    {
      key: 'estado',
      label: 'Estado',
      value: (u) => (u.activo ? 'Activo' : 'Sin acceso'),
      render: (u) => <Chip size="small" variant="outlined" color={u.activo ? 'success' : 'default'} label={u.activo ? 'Activo' : 'Sin acceso'} />,
    },
    { key: 'creado', label: 'Creado', value: (u) => formatDate(u.creado), defaultHidden: true },
  ];

  const titulo = editando === 'nuevo' ? 'Nuevo usuario de cliente' : editando ? `Usuario ${editando.usuario}` : '';
  const valido =
    form.nombre.trim().length >= 2 && form.clientes.length > 0 && (editando !== 'nuevo' || /^[A-Za-z0-9._-]{3,30}$/.test(form.usuario.trim()));
  const portal = typeof window !== 'undefined' ? `${window.location.origin}/auth` : '';

  return (
    <AppPage
      title="Usuarios de clientes"
      subtitle="Con estos usuarios los clientes entran al portal a ver sus guías, lo que se les cobra y su estado de cuenta."
      actions={
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => abrir('nuevo')}>
          Nuevo usuario
        </Button>
      }
    >
      <DataTable
        id="operacion-usuarios-clientes"
        columns={columnas}
        rows={data ?? []}
        getRowId={(u) => u.id}
        loading={isLoading}
        error={error}
        onRetry={() => mutate()}
        onRefresh={() => mutate()}
        searchable
        searchPlaceholder="Usuario, nombre o cliente"
        emptyMessage="Todavía no hay usuarios de cliente."
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
                helperText="Sin espacios, de 3 a 30 letras o números (p. ej. TAMARA). Con este entra el cliente."
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
            <ClientesMulti value={form.clientes} onChange={(v) => setForm((f) => ({ ...f, clientes: v }))} />
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
          <Alert severity="warning">Mándasela ahora al cliente: no se vuelve a mostrar. Si la pierde, genera una nueva.</Alert>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Entra en {portal}
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
