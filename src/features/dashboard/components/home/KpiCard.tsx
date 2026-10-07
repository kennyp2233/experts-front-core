'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Box, Card, CardActionArea, Skeleton, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

export type KpiTone = 'primary' | 'info' | 'warning' | 'error' | 'success';

export interface KpiCardProps {
  label: string;
  href: string;
  icon: ReactNode;
  tone?: KpiTone;
  value?: ReactNode;
  hint?: ReactNode;
  /** Mientras carga se muestran skeletons solo en esta tarjeta. */
  loading?: boolean;
  /** Mensaje corto cuando no se pudo calcular; reemplaza al hint y el valor pasa a "—". */
  unavailable?: string | null;
  /** Colorea el número cuando hay algo que atender. */
  highlight?: boolean;
}

export function KpiCard({
  label,
  href,
  icon,
  tone = 'primary',
  value,
  hint,
  loading = false,
  unavailable,
  highlight = false,
}: KpiCardProps) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardActionArea component={Link} href={href} sx={{ height: '100%', p: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              {label}
            </Typography>
            {loading ? (
              <Skeleton variant="text" width={72} sx={{ fontSize: '2.125rem' }} />
            ) : (
              <Typography
                variant="h4"
                component="p"
                fontWeight={700}
                sx={{
                  mt: 0.25,
                  lineHeight: 1.25,
                  fontVariantNumeric: 'tabular-nums',
                  color: unavailable ? 'text.disabled' : highlight ? `${tone}.main` : 'text.primary',
                }}
              >
                {unavailable ? '—' : value}
              </Typography>
            )}
            {loading ? (
              <Skeleton variant="text" width="70%" />
            ) : (
              (unavailable || hint) && (
                <Typography variant="caption" color="text.secondary" component="p">
                  {unavailable ?? hint}
                </Typography>
              )
            )}
          </Box>
          <Box
            aria-hidden
            sx={{
              width: 40,
              height: 40,
              flexShrink: 0,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              color: `${tone}.main`,
              bgcolor: (theme) => alpha(theme.palette[tone].main, 0.12),
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardActionArea>
    </Card>
  );
}
