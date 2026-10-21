'use client';

import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Paper,
  Skeleton,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  CheckCircleOutline as ConfirmarIcon,
  DeleteOutline as QuitarIcon,
  EditOutlined as CambiarIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useToast } from '@/shared/providers';
import { getErrorMessage } from '@/shared/utils';
import { useEquivalenciasEbf } from '../../hooks/useEbf';
import { ebfService } from '../../services/ebf.service';
import type { EquivalenciaEbf, ResultadoAprenderEbf, TipoEquivalenciaEbf } from '../../types/ebf';
import { EnlazarEbfDialog } from './EnlazarEbfDialog';

const TITULO: Record<TipoEquivalenciaEbf, { tab: string; local: string; ebf: string }> = {
  FINCA: { tab: 'Fincas', local: 'Finca', ebf: 'Exportador en EBF' },
  MARCA: { tab: 'Marcas', local: 'Marca', ebf: 'Marcación en EBF' },
  PRODUCTO: { tab: 'Productos', local: 'Producto', ebf: 'Producto en EBF' },
};

function OrigenChip({ e }: { e: EquivalenciaEbf }) {
  if (e.origen === 'MANUAL' || e.confirmada) {
    return (
      <Tooltip title={e.confirmadaPor ? `Confirmado por ${e.confirmadaPor}` : 'Confirmado'}>
        <Chip size="small" color="success" variant="outlined" label="Confirmado" />
      </Tooltip>
    );
  }
  return (
    <Tooltip title="Sacado de lo que la oficina ya tipeó en EBF (misma guía y misma DAE). Confirmarlo si está bien.">
      <Chip size="small" variant="outlined" label={`Del historial · ${e.vecesVista} ${e.vecesVista === 1 ? 'guía hija' : 'guías hijas'}`} />
    </Tooltip>
  );
}

/**
 * Enlaces con EBF: cómo se llama en EBF cada finca, marca y producto. Los
 * nombres casi nunca coinciden (ANDESBLOSSOM es MATIZ ROSES en EBF), así que se
 * aprenden de lo que la oficina ya tipeó y se confirman aquí.
 */
export function EnlacesEbf() {
  const toast = useToast();
  const [tipo, setTipo] = useState<TipoEquivalenciaEbf>('FINCA');
  const { equivalencias, error, isLoading, mutate } = useEquivalenciasEbf(tipo);
  const [q, setQ] = useState('');
  const [editar, setEditar] = useState<EquivalenciaEbf | null>(null);
  const [aprendiendo, setAprendiendo] = useState(false);
  const [resultado, setResultado] = useState<ResultadoAprenderEbf | null>(null);

  const filas = useMemo(() => {
    const t = q.trim().toUpperCase();
    return (equivalencias ?? []).filter((e) => !t || e.local.toUpperCase().includes(t) || e.ebfNombre.toUpperCase().includes(t));
  }, [equivalencias, q]);
  const porConfirmar = (equivalencias ?? []).filter((e) => !e.confirmada && e.origen !== 'MANUAL').length;

  const aprender = async () => {
    setAprendiendo(true);
    setResultado(null);
    try {
      const r = await ebfService.aprender(45);
      setResultado(r);
      await mutate();
    } catch (e) {
      toast.error(getErrorMessage(e, 'No se pudo leer el historial de EBF.'));
    } finally {
      setAprendiendo(false);
    }
  };

  const accion = async (fn: () => Promise<void>, ok: string) => {
    try {
      await fn();
      toast.success(ok);
      await mutate();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ sm: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 720 }}>
          Cómo se llama en EBF cada finca, marca y producto. Se aprende de lo que la oficina ya tipeó en EBF: la misma guía con
          la misma DAE es la misma finca. Lo confirmado a mano no se cambia solo.
        </Typography>
        <Tooltip title="Lee en EBF lo tipeado en las guías con EBF de los últimos 45 días (tarda un par de minutos).">
          <span>
            <Button variant="outlined" color="inherit" onClick={aprender} disabled={aprendiendo} sx={{ flexShrink: 0 }}>
              {aprendiendo ? 'Leyendo el historial de EBF…' : 'Aprender del historial'}
            </Button>
          </span>
        </Tooltip>
      </Stack>

      {resultado && (
        <Alert severity={resultado.conflictos.length ? 'warning' : 'success'} onClose={() => setResultado(null)}>
          {`Se leyeron ${resultado.leidas} de ${resultado.coordinaciones} guías: ${resultado.pares} guías hijas emparejadas, ${resultado.nuevas} enlaces nuevos, ${resultado.actualizadas} actualizados.`}
          {resultado.conflictos.map((c) => (
            <div key={`${c.tipo}${c.idLocal}`}>
              {`${c.local}: confirmado como «${c.confirmada}», pero en EBF se tipeó «${c.historial}».`}
            </div>
          ))}
          {resultado.errores.length > 0 && <div>{`No se pudieron leer: ${resultado.errores.join(' · ')}`}</div>}
        </Alert>
      )}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
        <Tabs value={tipo} onChange={(_, v) => setTipo(v)} sx={{ flex: 1, minHeight: 0 }}>
          {(Object.keys(TITULO) as TipoEquivalenciaEbf[]).map((t) => (
            <Tab key={t} value={t} label={TITULO[t].tab} />
          ))}
        </Tabs>
        <TextField
          size="small"
          placeholder="Buscar"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
        />
      </Stack>

      {error && <Alert severity="error">{getErrorMessage(error)}</Alert>}
      {porConfirmar > 0 && (
        <Typography variant="caption" color="text.secondary">
          {porConfirmar} sin confirmar: se usan igual (salen de lo que ya se tipeó), pero conviene revisarlos.
        </Typography>
      )}
      {isLoading ? (
        <Skeleton variant="rounded" height={300} />
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{TITULO[tipo].local}</TableCell>
                <TableCell>{TITULO[tipo].ebf}</TableCell>
                <TableCell>Origen</TableCell>
                <TableCell width={120} />
              </TableRow>
            </TableHead>
            <TableBody>
              {filas.map((e) => (
                <TableRow key={`${e.tipo}${e.idLocal}`} hover>
                  <TableCell>{e.local}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {e.ebfNombre}
                    </Typography>
                    {!e.ebfId && tipo !== 'PRODUCTO' && (
                      <Typography variant="caption" color="warning.main">
                        Sin id de EBF: elegirlo de la lista para poder enviar.
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <OrigenChip e={e} />
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    {!e.confirmada && e.origen !== 'MANUAL' && (
                      <Tooltip title="Está bien: confirmar">
                        <IconButton size="small" onClick={() => accion(() => ebfService.confirmar(e.tipo, e.idLocal), 'Enlace confirmado.')}>
                          <ConfirmarIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Cambiar">
                      <IconButton size="small" onClick={() => setEditar(e)}>
                        <CambiarIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Quitar el enlace">
                      <IconButton size="small" onClick={() => accion(() => ebfService.quitar(e.tipo, e.idLocal), 'Enlace quitado.')}>
                        <QuitarIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {filas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography variant="body2" color="text.secondary">
                      {equivalencias?.length ? 'Nada coincide con la búsqueda.' : 'Todavía no hay enlaces: "Aprender del historial".'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {editar && (
        <EnlazarEbfDialog
          tipo={editar.tipo}
          idLocal={editar.idLocal}
          local={editar.local}
          sugerencia={editar.ebfNombre}
          onClose={() => setEditar(null)}
          onGuardado={() => mutate()}
        />
      )}
    </Stack>
  );
}
