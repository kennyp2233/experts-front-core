"use client";

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
} from '@mui/material';
import { useAuth } from '@/features/auth';
import { logger } from '@/shared/utils/logger';

const profileLogger = logger.createChild('profile');

export default function ProfilePage() {
  const { user, enable2FA, confirm2FA, disable2FA } = useAuth();

  // Track 2FA status locally (since backend profile doesn't include it yet)
  const [is2FAEnabled, setIs2FAEnabled] = useState(user?.twoFactorEnabled ?? false);

  // 2FA Enable Flow
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [confirmCode, setConfirmCode] = useState('');

  // 2FA Disable Flow
  const [showDisableDialog, setShowDisableDialog] = useState(false);

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleEnable2FA = async () => {
    try {
      setLoading(true);
      setError('');
      profileLogger.debug('Starting 2FA enable process...');

      const response = await enable2FA();
      profileLogger.debug('2FA enable response received', response);

      setQrCode(response.qrCode);
      setSecret(response.secret);
      setShowQRDialog(true);
    } catch (err: any) {
      profileLogger.error('Failed to enable 2FA', err);
      setError(err.response?.data?.message || 'Error al habilitar 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm2FA = async () => {
    try {
      setLoading(true);
      setError('');
      profileLogger.debug('Confirming 2FA with code...');

      await confirm2FA(confirmCode);
      profileLogger.info('2FA confirmed successfully');

      setIs2FAEnabled(true); // Update local state
      setSuccess('2FA habilitado exitosamente');
      setShowQRDialog(false);
      setConfirmCode('');
      setQrCode('');
      setSecret('');
    } catch (err: any) {
      profileLogger.error('Failed to confirm 2FA', err);
      setError(err.response?.data?.message || 'Código inválido. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    try {
      setLoading(true);
      setError('');
      profileLogger.debug('Disabling 2FA...');

      await disable2FA();
      profileLogger.info('2FA disabled successfully');

      setIs2FAEnabled(false); // Update local state
      setSuccess('2FA deshabilitado exitosamente');
      setShowDisableDialog(false);
    } catch (err: any) {
      profileLogger.error('Failed to disable 2FA', err);
      setError(err.response?.data?.message || 'Error al deshabilitar 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseQRDialog = () => {
    setShowQRDialog(false);
    setConfirmCode('');
    setError('');
  };

  const handleCloseDisableDialog = () => {
    setShowDisableDialog(false);
    setError('');
  };

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Mi Perfil
      </Typography>

      {/* User Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Información Personal
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Stack spacing={2}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Nombre
              </Typography>
              <Typography variant="body1">
                {user.firstName} {user.lastName}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                Usuario
              </Typography>
              <Typography variant="body1">
                {user.username}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                Email
              </Typography>
              <Typography variant="body1">
                {user.email}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                Rol
              </Typography>
              <Typography variant="body1">
                {user.role}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* 2FA Settings */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Autenticación de Dos Factores (2FA)
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          <Typography variant="body2" color="text.secondary" paragraph>
            La autenticación de dos factores añade una capa adicional de seguridad a tu cuenta.
            Necesitarás tu contraseña y un código de tu aplicación de autenticación para iniciar sesión.
          </Typography>

          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Estado: {is2FAEnabled ? (
                <Typography component="span" color="success.main" fontWeight="bold">
                  Habilitado
                </Typography>
              ) : (
                <Typography component="span" color="text.secondary">
                  Deshabilitado
                </Typography>
              )}
            </Typography>
          </Box>

          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            {!is2FAEnabled ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleEnable2FA}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Habilitar 2FA'}
              </Button>
            ) : (
              <Button
                variant="outlined"
                color="error"
                onClick={() => setShowDisableDialog(true)}
                disabled={loading}
              >
                Deshabilitar 2FA
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onClose={handleCloseQRDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Habilitar Autenticación de Dos Factores</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Typography variant="body2" paragraph>
            1. Escanea este código QR con tu aplicación de autenticación (Google Authenticator, Authy, etc.)
          </Typography>

          {qrCode && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <img src={qrCode} alt="QR Code" style={{ maxWidth: '100%', height: 'auto' }} />
            </Box>
          )}

          <Typography variant="body2" paragraph>
            2. O ingresa este código manualmente:
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontFamily: 'monospace',
              bgcolor: 'grey.100',
              p: 1,
              borderRadius: 1,
              mb: 2,
              wordBreak: 'break-all',
            }}
          >
            {secret}
          </Typography>

          <Typography variant="body2" paragraph>
            3. Ingresa el código de 6 dígitos de tu aplicación para confirmar:
          </Typography>

          <TextField
            fullWidth
            label="Código de verificación"
            value={confirmCode}
            onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            inputProps={{ maxLength: 6 }}
            disabled={loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseQRDialog} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm2FA}
            variant="contained"
            disabled={loading || confirmCode.length !== 6}
          >
            {loading ? <CircularProgress size={24} /> : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Disable 2FA Dialog */}
      <Dialog open={showDisableDialog} onClose={handleCloseDisableDialog} maxWidth="sm">
        <DialogTitle>Deshabilitar 2FA</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Typography variant="body2">
            ¿Estás seguro de que quieres deshabilitar la autenticación de dos factores?
            Esto hará que tu cuenta sea menos segura.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDisableDialog} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleDisable2FA}
            variant="contained"
            color="error"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Deshabilitar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
