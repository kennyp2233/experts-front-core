'use client';

import { Chip, Tooltip } from '@mui/material';
import { formatDateTime } from '@/shared/utils';
import type { EstadoLineaEbf, ModoEnvioEbf, ResumenEbf, VentanaEbf } from '../../types/ebf';

type Color = 'success' | 'info' | 'warning' | 'error' | 'default';

/**
 * Nombres en palabras de la oficina. En las que vienen del sistema viejo
 * (`enviable = false`) no se envía nada: "por enviar" se lee "falta en EBF".
 */
const ESTADOS: Record<EstadoLineaEbf, { label: string; labelComparar?: string; color: Color; ayuda: string }> = {
  EN_EBF: { label: 'En EBF', color: 'success', ayuda: 'EBF tiene lo mismo que la coordinación.' },
  POR_ENVIAR: { label: 'Por enviar', labelComparar: 'Falta en EBF', color: 'info', ayuda: 'No está en EBF: se coordina allá.' },
  CAMBIO_POR_ENVIAR: {
    label: 'Cambio por enviar',
    labelComparar: 'Distinto en EBF',
    color: 'info',
    ayuda: 'EBF tiene otra cantidad: se corrige allá.',
  },
  PEDIR_A_EBF: {
    label: 'Pedir a EBF',
    color: 'warning',
    ayuda: 'EBF no deja hacer este cambio por el portal (bajar cajas o cambiar la DAE de otro día, o el vuelo ya salió).',
  },
  FALTA_ENLACE: {
    label: 'Falta enlazar',
    color: 'warning',
    ayuda: 'No se sabe cómo se llama en EBF la finca, la marca o el producto.',
  },
  SOLO_EN_EBF: { label: 'Solo en EBF', color: 'default', ayuda: 'Está en EBF pero no en la coordinación.' },
  ERROR: { label: 'No se pudo enviar', color: 'error', ayuda: 'EBF rechazó el último envío.' },
  OMITIDA: { label: 'Se hace a mano', color: 'default', ayuda: 'Se marcó para hacerlo a mano en EBF: no se envía.' },
};

export function EstadoLineaEbfChip({ estado, enviable }: { estado: EstadoLineaEbf; enviable: boolean }) {
  const e = ESTADOS[estado];
  return (
    <Tooltip title={e.ayuda}>
      <Chip size="small" label={!enviable && e.labelComparar ? e.labelComparar : e.label} color={e.color} variant="outlined" />
    </Tooltip>
  );
}

/** "mañana 08:00", "jue 08:00", "hoy 08:00" */
export function cuandoAbre(v: VentanaEbf): string {
  const d = new Date(v.proximaApertura);
  const hoy = new Date();
  const dia = (x: Date) => x.toLocaleDateString('es-EC', { timeZone: 'America/Guayaquil' });
  const manana = new Date(hoy.getTime() + 24 * 3600_000);
  const hora = d.toLocaleTimeString('es-EC', { timeZone: 'America/Guayaquil', hour: '2-digit', minute: '2-digit' });
  if (dia(d) === dia(hoy)) return `hoy ${hora}`;
  if (dia(d) === dia(manana)) return `mañana ${hora}`;
  return `${d.toLocaleDateString('es-EC', { timeZone: 'America/Guayaquil', weekday: 'long', day: 'numeric' })} ${hora}`;
}

/** Una línea que dice qué pasa con lo pendiente: modo y horario de EBF. */
export function textoVentana(modo: ModoEnvioEbf, v: VentanaEbf): { severidad: 'info' | 'warning' | 'success'; texto: string } {
  if (modo === 'comparar') {
    return {
      severidad: 'info',
      texto:
        'Modo comparación: se compara con lo que hay en EBF y se muestra lo que se enviaría, pero no se envía nada (lo sigue tipeando la oficina).',
    };
  }
  if (!v.abierta) {
    return {
      severidad: 'warning',
      texto: `EBF está cerrado (${v.horario}). Abre ${cuandoAbre(v)}${
        modo === 'automatico' ? ': lo pendiente se envía solo entonces' : ': lo pendiente se puede enviar desde entonces'
      }. No hace falta hacerlo a mano.`,
    };
  }
  return {
    severidad: 'success',
    texto:
      modo === 'automatico'
        ? 'EBF está abierto: lo pendiente se envía solo cada 15 minutos.'
        : 'EBF está abierto: lo pendiente se envía con "Enviar a EBF".',
  };
}

export const leidoHace = (iso: string | null) => (iso ? `Leído de EBF ${formatDateTime(iso)}` : 'Todavía no se leyó EBF');

/** Lo que pide atención, en pocas palabras ("2 por enviar · 1 pedir a EBF"). */
export function resumenCorto(r: ResumenEbf, enviable: boolean): string {
  const partes = [
    r.errores && `${r.errores} con error`,
    r.porEnviar && `${r.porEnviar} ${enviable ? 'por enviar' : 'distintas o faltan en EBF'}`,
    r.pedirAEbf && `${r.pedirAEbf} pedir a EBF`,
    r.faltaEnlace && `${r.faltaEnlace} falta enlazar`,
    r.soloEnEbf && `${r.soloEnEbf} solo en EBF`,
    r.omitidas && `${r.omitidas} a mano`,
  ].filter(Boolean);
  return partes.length ? partes.join(' · ') : 'Todo en EBF';
}

/** Va con EBF si su agencia IATA es de EBF ("EBF-EBF", "EXPERTS - EBFCARGO"…). */
export const vaConEbf = (agencia: { nombre?: string | null; alias?: string | null } | null | undefined) =>
  /EBF/i.test(`${agencia?.nombre ?? ''} ${agencia?.alias ?? ''}`);

export const atencion = (r: ResumenEbf) => r.errores + r.porEnviar + r.pedirAEbf + r.faltaEnlace + r.soloEnEbf > 0;
