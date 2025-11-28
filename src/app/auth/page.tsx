"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Tab,
  Tabs,
  CircularProgress,
  Grid,
  Paper,
  useTheme,
  useMediaQuery,
  keyframes
} from '@mui/material';
import { useAuth } from '../../features/auth';
import LoginForm from '../../features/auth/components/LoginForm';
import RegisterForm from '../../features/auth/components/RegisterForm';
import LogisticsGlobe from '../../features/auth/components/LogisticsGlobe';
import AuthMascot from '../../features/auth/components/AuthMascot';

const StaticText = ({ text, color }: { text: string; color?: string }) => {
  const textColor = color || 'text.primary';

  return (
    <Typography
      variant="h2"
      component="h1"
      sx={{
        fontWeight: 900,
        color: textColor,
        letterSpacing: '0.05em',
        position: 'relative',
        zIndex: 1
      }}
    >
      {text}
    </Typography>
  );
};

export default function AuthPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isDark = theme.palette.mode === 'dark';

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <CircularProgress sx={{ color: theme.palette.primary.main }} />
      </Box>
    );
  }

  // Inverted colors for the globe section
  const globeBg = isDark ? '#f0f2f5' : '#0f172a'; // Light bg in dark mode, Dark bg in light mode
  const globeTextColor = isDark ? '#0f172a' : '#f0f2f5'; // Dark text in dark mode (on light bg), Light text in light mode (on dark bg)

  return (
    <Grid container sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Left Side - 3D Visualization */}
      <Grid
        size={{ xs: 12, md: 7, lg: 8 }}
        sx={{
          position: 'relative',
          display: { xs: 'none', md: 'block' },
          height: '100vh',
          overflow: 'hidden',
          bgcolor: globeBg, // Apply inverted background
          transition: 'background-color 0.3s ease'
        }}
      >
        <LogisticsGlobe />

        {/* Overlay Text */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 80,
            left: 80,
            zIndex: 10,
            pointerEvents: 'none'
          }}
        >
          <StaticText text="EXPERTS" color={globeTextColor} />
          <Typography
            variant="h5"
            sx={{
              color: globeTextColor,
              mt: 1,
              fontWeight: 300,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              borderLeft: `4px solid ${theme.palette.primary.main} `,
              pl: 2,
              opacity: 0.8
            }}
          >
            Next-Gen Logistics Core
          </Typography>
        </Box>
      </Grid>

      {/* Right Side - Glassmorphism Login Form */}
      <Grid
        size={{ xs: 12, md: 5, lg: 4 }}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(12px)',
          p: 4,
          boxShadow: isDark ? '-10px 0 30px rgba(0,0,0,0.5)' : '-10px 0 30px rgba(0,0,0,0.1)',
          zIndex: 2,
          borderLeft: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)'
        }}
      >
        <Container maxWidth="xs">
          <Box sx={{ mb: 6, textAlign: 'center' }}>
            {/* Mobile Logo only */}
            <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 3 }}>
              <StaticText text="EXPERTS" />
            </Box>

            <AuthMascot isShy={isPasswordFocused} />

            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
              Bienvenido
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Accede a la plataforma
            </Typography>
          </Box>

          <Paper
            elevation={0}
            sx={{
              p: 0,
              bgcolor: 'transparent',
              '& .MuiTextField-root': {
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: 'text.primary',
                  '& fieldset': {
                    borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: theme.palette.primary.main,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.primary.main,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'text.secondary',
                  '&.Mui-focused': {
                    color: theme.palette.primary.main,
                  },
                }
              },
              '& .MuiButton-contained': {
                bgcolor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                fontWeight: 'bold',
                boxShadow: `0 0 15px ${theme.palette.primary.main} 40`, // Neon glow
                '&:hover': {
                  bgcolor: theme.palette.primary.dark,
                  boxShadow: `0 0 25px ${theme.palette.primary.main} 60`,
                }
              }
            }}
          >
            <Tabs
              value={tabValue}
              onChange={(_, newValue) => setTabValue(newValue)}
              variant="fullWidth"
              sx={{
                mb: 4,
                borderBottom: 1,
                borderColor: 'divider',
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 500,
                  color: 'text.secondary',
                  '&.Mui-selected': {
                    color: theme.palette.primary.main,
                  }
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: theme.palette.primary.main,
                  height: 3,
                  boxShadow: `0 0 10px ${theme.palette.primary.main} `
                }
              }}
            >
              <Tab label="Iniciar Sesión" />
              <Tab label="Registrarse" />
            </Tabs>

            <Box sx={{ mt: 2 }}>
              {tabValue === 0 && <LoginForm onPasswordFocus={setIsPasswordFocused} />}
              {tabValue === 1 && <RegisterForm onPasswordFocus={setIsPasswordFocused} />}
            </Box>
          </Paper>

          <Box sx={{ mt: 8, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              © {new Date().getFullYear()} Experts Front Core.
            </Typography>
          </Box>
        </Container>
      </Grid>
    </Grid>
  );
}
