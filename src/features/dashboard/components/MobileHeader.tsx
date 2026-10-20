'use client';

import { AppBar, Toolbar, IconButton, Typography, Box } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { MarcaExperts } from '@/shared/components/ui/MarcaExperts';

interface MobileHeaderProps {
    onMenuClick: () => void;
    title?: string;
}

/**
 * Mobile header component with hamburger menu button.
 * Only rendered on mobile viewports.
 */
export function MobileHeader({ onMenuClick, title = 'Experts' }: MobileHeaderProps) {
    return (
        <AppBar
            position="sticky"
            elevation={0}
            sx={{
                bgcolor: 'background.paper',
                borderBottom: 1,
                borderColor: 'divider',
            }}
        >
            <Toolbar sx={{ minHeight: 56 }}>
                <IconButton
                    edge="start"
                    color="inherit"
                    aria-label="Abrir el menú"
                    onClick={onMenuClick}
                    sx={{
                        mr: 1,
                        color: 'text.primary',
                    }}
                >
                    <MenuIcon />
                </IconButton>
                <Box sx={{ mr: 1.25, display: 'flex' }}>
                    <MarcaExperts size={28} />
                </Box>

                <Typography
                    variant="h6"
                    component="h1"
                    sx={{
                        fontWeight: 600,
                        color: 'text.primary',
                        fontSize: '1.1rem',
                    }}
                >
                    {title}
                </Typography>

                {/* Spacer for potential future actions */}
                <Box sx={{ flexGrow: 1 }} />
            </Toolbar>
        </AppBar>
    );
}
