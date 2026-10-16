'use client';

import { Box, IconButton, Paper, Tooltip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ContentCopy as CopiarIcon } from '@mui/icons-material';
import { useToast } from '@/shared/providers';
import { formatDate } from '@/shared/utils';
import type { CoordinacionDetalle } from '../../types/coordinacion';
import { formatoAwb, kg, nombreCorto, nombreRef, textoIngreso } from '../../utils/formato';

const nums = { fontVariantNumeric: 'tabular-nums' } as const;

/** Etiqueta y valor; vacío → "—" en gris. */
function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  const vacio = children === null || children === undefined || children === '';
  return (
    <>
      <Typography component="dt" variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
        {label}
      </Typography>
      <Typography
        component="dd"
        variant="body2"
        fontWeight={vacio ? 400 : 500}
        color={vacio ? 'text.disabled' : undefined}
        sx={{ m: 0, minWidth: 0, overflowWrap: 'anywhere' }}
      >
        {vacio ? '—' : children}
      </Typography>
    </>
  );
}

/**
 * La cabecera del documento como en la ventana vieja: los mismos campos, en
 * dos columnas y en el mismo orden (Consignatario · Embarcador · Aerolínea ·
 * Número Guía · Tipo Embarque · Referencia | Agencia IATA · Destino · Fecha
 * Vuelo · Manifiesto…), y la nota a todo el ancho al pie.
 */
export function FichaCoordinacion({ c }: { c: CoordinacionDetalle }) {
  const toast = useToast();
  const guia = formatoAwb(c.numeroGuia);
  const destino = [c.destino?.codigo, c.destinoFinal?.codigo && c.destinoFinal.codigo !== c.destino?.codigo ? c.destinoFinal.codigo : null]
    .filter(Boolean)
    .join(' → ');
  const cobrableCliente =
    c.corteExtra && c.liquidacion.pesoCobrable !== null && c.liquidacion.pesoCobrable !== c.pesoCobrable
      ? ` · al cliente ${kg(c.liquidacion.pesoCobrable)}`
      : '';

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(guia);
      toast.success(`Guía ${guia} copiada.`);
    } catch {
      toast.error('No se pudo copiar.');
    }
  };

  const izquierda: Array<[string, React.ReactNode]> = [
    ['Consignatario', c.consignatario?.nombre],
    ['Embarcador', c.cliente?.nombre],
    ['Aerolínea', c.aerolinea ? nombreCorto(c.aerolinea) : null],
    [
      'Número guía',
      <Box key="g" component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
        <Box component="span" sx={{ ...nums, fontWeight: 700 }}>
          {guia}
        </Box>
        <Typography component="span" variant="caption" color="text.secondary">
          {[c.guiaMadre.virtual ? 'virtual' : 'normal', c.guiaMadre.lote ? textoIngreso(c.guiaMadre.lote.codigoAccess ?? c.guiaMadre.lote.id) : null]
            .filter(Boolean)
            .join(' · ')}
        </Typography>
        <Tooltip title="Copiar el número de guía">
          <IconButton size="small" onClick={copiar} aria-label="Copiar el número de guía" sx={{ p: 0.25 }}>
            <CopiarIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Tooltip>
      </Box>,
    ],
    ['Tipo de embarque', c.tipoEmbarque?.nombre],
    ['Referencia', c.referencia],
  ];
  const derecha: Array<[string, React.ReactNode]> = [
    ['Agencia IATA', c.agencia ? nombreRef(c.agencia) : null],
    ['Destino', destino],
    ['Fecha de vuelo', formatDate(c.fechaVuelo)],
    ['Manifiesto', c.codigoManifiesto ? <span style={nums}>{c.codigoManifiesto}</span> : null],
    ['Peso cobrable', c.pesoCobrable !== null ? `${kg(c.pesoCobrable)}${cobrableCliente}` : null],
    ['Pago', c.pago === 'COLLECT' ? 'Collect' : 'Prepaid'],
  ];

  const lista = (campos: Array<[string, React.ReactNode]>) => (
    <Box
      component="dl"
      sx={{ display: 'grid', gridTemplateColumns: 'max-content minmax(0, 1fr)', columnGap: 2, rowGap: 0.75, m: 0, alignContent: 'start' }}
    >
      {campos.map(([k, v]) => (
        <Campo key={k} label={k}>
          {v}
        </Campo>
      ))}
    </Box>
  );

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, columnGap: 4, rowGap: 0.75 }}>
        {lista(izquierda)}
        {lista(derecha)}
      </Box>
      {c.nota && (
        <Box sx={{ mt: 1.5, px: 1.5, py: 1, borderRadius: 1, bgcolor: (t) => alpha(t.palette.warning.main, 0.08), border: 1, borderColor: 'warning.light' }}>
          <Typography variant="body2">
            <Box component="span" sx={{ color: 'text.secondary', mr: 1 }}>
              Nota
            </Box>
            <strong>{c.nota}</strong>
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
