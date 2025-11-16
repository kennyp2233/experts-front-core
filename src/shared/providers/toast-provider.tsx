"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';

export interface ToastOptions {
  message: string;
  severity?: AlertColor;
  duration?: number;
  autoHide?: boolean;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastState extends ToastOptions {
  open: boolean;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: '',
    severity: 'info',
    duration: 5000,
    autoHide: true,
  });

  const showToast = useCallback(({
    message,
    severity = 'info',
    duration = 5000,
    autoHide = true,
  }: ToastOptions) => {
    setToast({
      open: true,
      message,
      severity,
      duration,
      autoHide,
    });
  }, []);

  const success = useCallback((message: string, duration = 5000) => {
    showToast({ message, severity: 'success', duration });
  }, [showToast]);

  const error = useCallback((message: string, duration = 6000) => {
    showToast({ message, severity: 'error', duration });
  }, [showToast]);

  const warning = useCallback((message: string, duration = 5000) => {
    showToast({ message, severity: 'warning', duration });
  }, [showToast]);

  const info = useCallback((message: string, duration = 5000) => {
    showToast({ message, severity: 'info', duration });
  }, [showToast]);

  const handleClose = useCallback((_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setToast((prev) => ({ ...prev, open: false }));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <Snackbar
        open={toast.open}
        autoHideDuration={toast.autoHide ? toast.duration : null}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleClose} severity={toast.severity} variant="standard" sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
