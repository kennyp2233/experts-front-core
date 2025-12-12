'use client';

import { AppBar, Toolbar, IconButton, Typography, Box } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';

interface MobileHeaderProps {
    onMenuClick: () => void;
    title?: string;
}

/**
 * Mobile header component with hamburger menu button.
 * Only rendered on mobile viewports.
 */
export function MobileHeader({ onMenuClick, title = 'Experts Core' }: MobileHeaderProps) {
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
                    aria-label="open navigation menu"
                    onClick={onMenuClick}
                    sx={{
                        mr: 2,
                        color: 'text.primary',
                    }}
                >
                    <MenuIcon />
                </IconButton>

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
