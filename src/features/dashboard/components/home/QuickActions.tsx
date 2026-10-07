'use client';

import Link from 'next/link';
import { Box, Button, Card, Divider, Stack, Typography } from '@mui/material';
import {
  AddCircleOutline as AddIcon,
  DescriptionOutlined as DaesIcon,
  FactCheckOutlined as FitoIcon,
} from '@mui/icons-material';

interface QuickActionsProps {
  isAdmin: boolean;
}

export function QuickActions({ isAdmin }: QuickActionsProps) {
  return (
    <Card variant="outlined" sx={{ '&:hover': { transform: 'none' } }}>
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="subtitle1" component="h2" fontWeight={600}>
          Accesos rápidos
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Tareas frecuentes
        </Typography>
      </Box>
      <Divider />
      <Stack spacing={1} sx={{ p: 2 }}>
        <Button
          component={Link}
          href="/ebf/coordinaciones/nueva"
          variant="contained"
          startIcon={<AddIcon />}
          fullWidth
        >
          Nueva coordinación
        </Button>
        {isAdmin && (
          <Button component={Link} href="/admin/fito" variant="outlined" startIcon={<FitoIcon />} fullWidth>
            Generar FITO
          </Button>
        )}
        <Button component={Link} href="/ebf/daes" variant="outlined" startIcon={<DaesIcon />} fullWidth>
          Ver DAEs
        </Button>
      </Stack>
    </Card>
  );
}
