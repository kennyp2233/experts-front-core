"use client";

import { useState } from 'react';
import { TextField, Button, Box, Stack, CircularProgress, Typography, Checkbox, FormControlLabel } from '@mui/material';
import { useAuth } from '../hooks/useAuth.hook';
import { useErrorHandler } from '@/shared/hooks';
import { useToast } from '@/shared/providers';
import { LoginRequest } from '../types/auth.types';
import OTPInput from '@/shared/components/OTPInput';

interface LoginFormProps {
  onPasswordFocus?: (focused: boolean) => void;
}

export default function LoginForm({ onPasswordFocus }: LoginFormProps) {
  const { login, requires2FA, tempToken, verify2FA, resetLogin } = useAuth();
  const toast = useToast();
  const { getErrorMessage } = useErrorHandler();
  const [formData, setFormData] = useState<LoginRequest>({ username: '', password: '' });
  const [twoFactorCode, setTwoFactorCode] = useState(['', '', '', '', '', '']);
  const [trustDevice, setTrustDevice] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (requires2FA && tempToken) {
        const code = twoFactorCode.join('');
        await verify2FA(code, trustDevice);
        // 2FA verified: SWR cache is seeded by the hook; /auth/page.tsx will
        // route to /dashboard on the next render. Keep loading=true so the
        // form doesn't flash before unmount.
      } else {
        const response = await login(formData);
        if (response.requires2FA) {
          // Next render will show the 2FA UI — re-enable inputs.
          setLoading(false);
        }
        // Otherwise: login succeeded fully. Leave loading=true; the redirect
        // to /dashboard in /auth/page.tsx will unmount this form.
      }
    } catch (err: any) {
      const errorMessage = getErrorMessage(err, 'Error al iniciar sesión');

      if (err?.response?.status === 429) {
        toast.error('Demasiados intentos fallidos. Cuenta bloqueada temporalmente.');
        resetLogin();
      } else {
        toast.error(errorMessage);
      }
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleReset = () => {
    setFormData({ username: '', password: '' });
    setTwoFactorCode(['', '', '', '', '', '']);
    setTrustDevice(false);
    resetLogin();
  };

  if (requires2FA) {
    return (
      <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
        <Stack spacing={2}>
          <Typography variant="h6" align="center">
            Verificación de 2 Factores
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            Ingresa tu código 2FA de 6 dígitos
          </Typography>

          <OTPInput
            value={twoFactorCode}
            onChange={setTwoFactorCode}
            disabled={loading}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={trustDevice}
                onChange={(e) => setTrustDevice(e.target.checked)}
                disabled={loading}
              />
            }
            label="Confiar en este dispositivo por 30 días"
          />

          <Stack direction="row" spacing={1}>
            <Button
              type="button"
              fullWidth
              variant="outlined"
              onClick={handleReset}
              disabled={loading}
            >
              Atrás
            </Button>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading || twoFactorCode.some(digit => digit === '')}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {loading ? 'Verificando...' : 'Verificar'}
            </Button>
          </Stack>
        </Stack>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      <Stack spacing={2}>
        <TextField
          fullWidth
          label="Usuario"
          name="username"
          value={formData.username}
          onChange={handleChange}
          required
          disabled={loading}
          variant="outlined"
          size="small"
        />

        <TextField
          fullWidth
          label="Contraseña"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required
          disabled={loading}
          variant="outlined"
          size="small"
          onFocus={() => onPasswordFocus?.(true)}
          onBlur={() => onPasswordFocus?.(false)}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading}
          sx={{ mt: 1, py: 1 }}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </Button>
      </Stack>
    </Box>
  );
}