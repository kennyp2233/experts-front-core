"use client";

import { useState } from 'react';
import { TextField, Button, Box, Stack, CircularProgress } from '@mui/material';
import { useAuth } from '../hooks/useAuth.hook';
import { useErrorHandler } from '@/shared/hooks';
import { useToast } from '@/shared/providers';
import { RegisterRequest } from '../types/auth.types';

export default function RegisterForm() {
  const { register } = useAuth();
  const toast = useToast();
  const { getErrorMessage } = useErrorHandler();
  const [formData, setFormData] = useState<RegisterRequest>({
    email: '',
    username: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await register(formData);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Error en el registro'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      <Stack spacing={2}>
        <TextField
          fullWidth
          label="Nombre"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          required
          disabled={loading}
          variant="outlined"
          size="small"
        />

        <TextField
          fullWidth
          label="Apellido"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          required
          disabled={loading}
          variant="outlined"
          size="small"
        />

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
          label="Correo electrónico"
          name="email"
          type="email"
          value={formData.email}
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
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading}
          sx={{ mt: 1, py: 1 }}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {loading ? 'Registrando...' : 'Registrarse'}
        </Button>
      </Stack>
    </Box>
  );
}