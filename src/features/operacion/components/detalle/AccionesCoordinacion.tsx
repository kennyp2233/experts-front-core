'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import { ContentCut as CortarIcon, DeleteOutline as AnularIcon, Edit as EditarIcon } from '@mui/icons-material';
import { useToast } from '@/shared/providers';
import { getErrorMessage } from '@/shared/utils';
import { operacionService } from '../../services/operacion.service';
import type { CoordinacionDetalle, Liquidacion, ValoresLiquidacion } from '../../types/coordinacion';
import { CODIGOS_AGENCIA, CONCEPTOS_AEROLINEA } from '../../types/coordinacion';
import { usd } from '../../utils/formato';
import { LiquidacionEditor } from '../coordinar/LiquidacionEditor';
import { LiquidacionForm, numero, texto } from '../coordinar/formulario';

const CAMPOS: Array<keyof ValoresLiquidacion> = [
  'pesoCobrable',
  'tarifa',
  ...CONCEPTOS_AEROLINEA,
  'iva',
  ...CODIGOS_AGENCIA,
];

/** Resumen local (mismas fórmulas del servidor) para el diálogo de corte extra. */
function resumir(v: LiquidacionForm) {
  const n = (k: keyof ValoresLiquidacion) => numero(v[k]) ?? 0;
  const r2 = (x: number) => Math.round((x + Number.EPSILON) * 100) / 100;
  const cw = numero(v.pesoCobrable);
  const tarifa = numero(v.tarifa);
  const flete = cw !== undefined && tarifa !== undefined ? r2(cw * tarifa) : null;
  const dueCarrier = r2(CONCEPTOS_AEROLINEA.reduce((a, k) => a + n(k), 0));
  const dueAgent = r2(CODIGOS_AGENCIA.reduce((a, k) => a + n(k), 0));
  const iva = r2(n('iva'));
  return {
    pesoCobrable: cw ?? null,
    tarifa: tarifa ?? null,
    flete,
    dueCarrier,
    dueAgent,
    iva,
    total: flete === null ? null : r2(flete + dueCarrier + iva + dueAgent),
  };
}

const aForm = (l: Liquidacion | undefined): LiquidacionForm =>
  Object.fromEntries(CAMPOS.map((k) => [k, texto(l?.[k as keyof Liquidacion] as number | null, 4)]));

function CortarDialog({ c, open, onClose, onCortada }: { c: CoordinacionDetalle; open: boolean; onClose: () => void; onCortada: () => void }) {
  const toast = useToast();
  const normal = c.liquidaciones.find((l) => l.tipo === 'NORMAL');
  const [extra, setExtra] = useState(false);
  const [valores, setValores] = useState<LiquidacionForm>(() => aForm(normal));
  const [trabajando, setTrabajando] = useState(false);
  const { data: parametros } = useSWR(open ? ['operacion/coordinar/parametros', c.aerolinea?.id ?? null] : null, () =>
    operacionService.parametrosCoordinacion(c.aerolinea?.id ?? null),
  );
  const resumen = useMemo(() => resumir(valores), [valores]);

  const cortar = async () => {
    setTrabajando(true);
    try {
      let dto: ValoresLiquidacion | undefined;
      if (extra) {
        dto = {};
        for (const k of CAMPOS) {
          const n = numero(valores[k]);
          if (n !== undefined) dto[k] = n;
        }
      }
      await operacionService.cortarCoordinacion(c.id, dto);
      toast.success('Guía cortada.');
      onCortada();
      onClose();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setTrabajando(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth={extra ? 'lg' : 'sm'}>
      <DialogTitle>Cortar guía {c.numeroGuia}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Alert severity="warning" variant="outlined">
            El corte es definitivo: después ya no se puede modificar ni anular la coordinación.
          </Alert>
          <Typography variant="body2">
            Total con los valores actuales: <strong>{usd(c.liquidacion.total)}</strong> ({c.guias.length} guías hijas).
          </Typography>
          <FormControlLabel
            control={<Switch checked={extra} onChange={(e) => setExtra(e.target.checked)} />}
            label={
              <Box>
                <Typography variant="body2">Corte extra</Typography>
                <Typography variant="caption" color="text.secondary">
                  Valores distintos para facturar (se parte de los actuales). El total de la guía pasa a ser el del corte extra.
                </Typography>
              </Box>
            }
          />
          {extra && (
            <LiquidacionEditor
              valores={valores}
              onChange={(k, v) => setValores((x) => ({ ...x, [k]: v }))}
              parametros={parametros}
              resumen={resumen}
              pesoBruto={c.totalKgs ?? undefined}
              liqAuto={false}
              cwAuto={false}
              conHandlingCliente={false}
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={trabajando}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="warning"
          onClick={cortar}
          disabled={trabajando}
          startIcon={trabajando ? <CircularProgress size={16} color="inherit" /> : <CortarIcon />}
        >
          Cortar guía
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * Acciones sobre una coordinación del sistema nuevo mientras está abierta:
 * editar, cortar (definitivo) y anular (libera la guía). Las que vienen del
 * sistema viejo se ven pero no se tocan.
 */
export function AccionesCoordinacion({ c, onCambio }: { c: CoordinacionDetalle; onCambio: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [cortar, setCortar] = useState(false);
  const [anular, setAnular] = useState(false);
  const [trabajando, setTrabajando] = useState(false);

  if (c.origen !== 'SISTEMA' || c.estado !== 'BORRADOR') return null;

  const confirmarAnular = async () => {
    setTrabajando(true);
    try {
      await operacionService.anularCoordinacion(c.id);
      toast.success(`Coordinación anulada: la guía ${c.numeroGuia ?? ''} vuelve a estar disponible.`);
      router.push('/operacion/coordinaciones');
    } catch (e) {
      toast.error(getErrorMessage(e));
      setTrabajando(false);
    }
  };

  return (
    <>
      <Button component={Link} href={`/operacion/coordinaciones/${c.id}/editar`} startIcon={<EditarIcon />} variant="outlined">
        Editar
      </Button>
      <Button startIcon={<CortarIcon />} variant="contained" onClick={() => setCortar(true)}>
        Cortar guía
      </Button>
      <Button startIcon={<AnularIcon />} color="error" onClick={() => setAnular(true)}>
        Anular
      </Button>

      {cortar && <CortarDialog c={c} open={cortar} onClose={() => setCortar(false)} onCortada={onCambio} />}

      <Dialog open={anular} onClose={() => setAnular(false)} maxWidth="xs" fullWidth>
        <DialogTitle>¿Anular la coordinación?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Se borran sus guías hijas y la guía {c.numeroGuia} vuelve al stock como disponible. Los números de guía hija
            usados no se reutilizan.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnular(false)} disabled={trabajando}>
            Cancelar
          </Button>
          <Button color="error" variant="contained" onClick={confirmarAnular} disabled={trabajando}>
            Anular
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
