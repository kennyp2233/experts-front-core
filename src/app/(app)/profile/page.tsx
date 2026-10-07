"use client";

import { useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { useUser, useEnable2FA, useConfirm2FA, useDisable2FA } from '@/features/auth';
import { useToast } from '@/shared/providers/toast-provider';
import { useErrorHandler } from '@/shared/hooks';
import OTPInput from '@/shared/components/OTPInput';
import { AppPage } from '@/shared/components/ui/AppPage';
import { roleLabel } from '@/features/dashboard/roles';

const PAGE_TITLE = 'Mi perfil';
const PAGE_SUBTITLE = 'Tus datos de acceso y la seguridad de tu cuenta.';
// Formulario de lectura: el título queda alineado con el resto de pantallas
// y solo el contenido se limita a un ancho cómodo de leer.
const CONTENT_MAX_WIDTH = 720;

export default function ProfilePage() {
  const { user, isLoading: userLoading } = useUser();
  const { enable2FA, isLoading: enableLoading, data: enable2FAData } = useEnable2FA();
  const { confirm2FA, isLoading: confirmLoading } = useConfirm2FA();
  const { disable2FA, isLoading: disableLoading } = useDisable2FA();

  const toast = useToast();
  const { getErrorMessage } = useErrorHandler();

  // Track 2FA status locally (updated after successful operations)
  const [is2FAEnabled, setIs2FAEnabled] = useState(user?.twoFactorEnabled ?? false);

  // 2FA Enable Flow
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [confirmCode, setConfirmCode] = useState(['', '', '', '', '', '']);

  // 2FA Disable Flow
  const [showDisableDialog, setShowDisableDialog] = useState(false);

  const handleEnable2FA = async () => {
    try {
      await enable2FA();
      setShowQRDialog(true);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Error al habilitar 2FA'));
    }
  };

  const handleConfirm2FA = async () => {
    const code = confirmCode.join('');
    if (code.length !== 6) return;

    try {
      await confirm2FA({ token: code });

      setIs2FAEnabled(true);
      setShowQRDialog(false);
      setConfirmCode(['', '', '', '', '', '']);
      toast.success('2FA habilitado exitosamente');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Código inválido. Intenta nuevamente.'));
    }
  };

  const handleDisable2FA = async () => {
    try {
      await disable2FA();

      setIs2FAEnabled(false);
      setShowDisableDialog(false);
      toast.success('2FA deshabilitado exitosamente');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Error al deshabilitar 2FA'));
    }
  };

  const handleCloseQRDialog = () => {
    setShowQRDialog(false);
    setConfirmCode(['', '', '', '', '', '']);
  };

  if (userLoading) {
    return (
      <AppPage title={PAGE_TITLE} subtitle={PAGE_SUBTITLE}>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4, maxWidth: CONTENT_MAX_WIDTH }}>
          <CircularProgress />
        </Box>
      </AppPage>
    );
  }

  if (!user) {
    return (
      <AppPage title={PAGE_TITLE} subtitle={PAGE_SUBTITLE}>
        <Alert severity="error" sx={{ maxWidth: CONTENT_MAX_WIDTH }}>
          No se pudo cargar el perfil del usuario.
        </Alert>
      </AppPage>
    );
  }

  const qrCode = enable2FAData?.qrCode;
  const secret = enable2FAData?.secret;
  const isAnyLoading = enableLoading || confirmLoading || disableLoading;

  return (
    <AppPage title={PAGE_TITLE} subtitle={PAGE_SUBTITLE}>
      <Box sx={{ maxWidth: CONTENT_MAX_WIDTH }}>
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
                <Typography variant="body1">{user.username}</Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">{user.email}</Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Rol
                </Typography>
                <Typography variant="body1">{roleLabel(user.role)}</Typography>
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

            <Typography variant="body2" color="text.secondary" paragraph>
              La autenticación de dos factores añade una capa adicional de seguridad a tu cuenta.
              Necesitarás tu contraseña y un código de tu aplicación de autenticación para iniciar
              sesión.
            </Typography>

            <Box mb={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={is2FAEnabled}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleEnable2FA();
                      } else {
                        setShowDisableDialog(true);
                      }
                    }}
                    disabled={isAnyLoading}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Autenticación de Dos Factores
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {is2FAEnabled ? 'Habilitado' : 'Deshabilitado'}
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onClose={handleCloseQRDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Habilitar Autenticación de Dos Factores</DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph>
            1. Escanea este código QR con tu aplicación de autenticación (Google Authenticator,
            Authy, etc.)
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

          <OTPInput
            value={confirmCode}
            onChange={setConfirmCode}
            disabled={confirmLoading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseQRDialog} disabled={confirmLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm2FA}
            variant="contained"
            disabled={confirmLoading || confirmCode.some(digit => digit === '')}
          >
            {confirmLoading ? <CircularProgress size={24} /> : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Disable 2FA Dialog */}
      <Dialog open={showDisableDialog} onClose={() => setShowDisableDialog(false)} maxWidth="sm">
        <DialogTitle>Deshabilitar 2FA</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            ¿Estás seguro de que quieres deshabilitar la autenticación de dos factores? Esto hará
            que tu cuenta sea menos segura.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDisableDialog(false)} disabled={disableLoading}>
            Cancelar
          </Button>
          <Button onClick={handleDisable2FA} variant="contained" color="error" disabled={disableLoading}>
            {disableLoading ? <CircularProgress size={24} /> : 'Deshabilitar'}
          </Button>
        </DialogActions>
      </Dialog>
    </AppPage>
  );
}
