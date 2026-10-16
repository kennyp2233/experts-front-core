'use client';

import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { ContentCopy as CopiarIcon } from '@mui/icons-material';
import { useToast } from '@/shared/providers';
import { formatDate } from '@/shared/utils';
import type { CoordinacionDetalle } from '../../types/coordinacion';
import { formatoAwb, kg, nombreCorto, nombreRef, textoIngreso } from '../../utils/formato';
import { type CampoFicha, FichaCampos } from '../FichaCampos';

const nums = { fontVariantNumeric: 'tabular-nums' } as const;

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

  const izquierda: CampoFicha[] = [
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
  const derecha: CampoFicha[] = [
    ['Agencia IATA', c.agencia ? nombreRef(c.agencia) : null],
    ['Destino', destino],
    ['Fecha de vuelo', formatDate(c.fechaVuelo)],
    ['Manifiesto', c.codigoManifiesto ? <span style={nums}>{c.codigoManifiesto}</span> : null],
    ['Peso cobrable', c.pesoCobrable !== null ? `${kg(c.pesoCobrable)}${cobrableCliente}` : null],
    ['Pago', c.pago === 'COLLECT' ? 'Collect' : 'Prepaid'],
  ];

  return <FichaCampos izquierda={izquierda} derecha={derecha} nota={c.nota} />;
}
