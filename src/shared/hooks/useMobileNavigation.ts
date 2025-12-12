'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTheme, useMediaQuery } from '@mui/material';

export interface UseMobileNavigationReturn {
    /** Whether the current viewport is considered mobile */
    isMobile: boolean;
    /** Whether the mobile drawer is currently open */
    drawerOpen: boolean;
    /** Toggle the drawer open/closed state */
    toggleDrawer: () => void;
    /** Open the drawer */
    openDrawer: () => void;
    /** Close the drawer */
    closeDrawer: () => void;
}

/**
 * Hook to manage mobile navigation state including drawer visibility
 * and responsive breakpoint detection.
 * 
 * @param breakpoint - The MUI breakpoint to use for mobile detection (default: 'md')
 * @returns Navigation state and control functions
 */
export function useMobileNavigation(breakpoint: 'sm' | 'md' | 'lg' = 'md'): UseMobileNavigationReturn {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down(breakpoint));
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Close drawer when switching from mobile to desktop
    useEffect(() => {
        if (!isMobile && drawerOpen) {
            setDrawerOpen(false);
        }
    }, [isMobile, drawerOpen]);

    const toggleDrawer = useCallback(() => {
        setDrawerOpen((prev) => !prev);
    }, []);

    const openDrawer = useCallback(() => {
        setDrawerOpen(true);
    }, []);

    const closeDrawer = useCallback(() => {
        setDrawerOpen(false);
    }, []);

    return {
        isMobile,
        drawerOpen,
        toggleDrawer,
        openDrawer,
        closeDrawer,
    };
}
