'use client';

import React from 'react';
import { Tabs, Tab, TabsProps, SxProps, Theme } from '@mui/material';

export interface FormTab {
  key: string;
  label: string;
}

export interface FormTabsProps extends Omit<TabsProps, 'onChange'> {
  tabs: FormTab[];
  activeTab: number;
  onTabChange: (newTab: number) => void;
  sx?: SxProps<Theme>;
}

/**
 * Componente reutilizable para tabs en formularios
 * Centraliza estilos consistentes de tabs
 */
export const FormTabs: React.FC<FormTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  sx = {},
  ...tabsProps
}) => {
  return (
    <Tabs
      value={activeTab}
      onChange={(_, newValue) => onTabChange(newValue)}
      variant="fullWidth"
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        mb: 2,
        '& .MuiTab-root': {
          fontWeight: 500,
          fontSize: '0.95rem',
          textTransform: 'none',
        },
        '& .Mui-selected': {
          fontWeight: 600,
        },
        ...sx,
      }}
      {...tabsProps}
    >
      {tabs.map((tab, index) => (
        <Tab key={tab.key} label={tab.label} />
      ))}
    </Tabs>
  );
};
