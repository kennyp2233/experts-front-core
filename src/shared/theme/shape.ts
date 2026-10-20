// Unidad de redondeo: `borderRadius: 1` en sx = 8px (con 12, `borderRadius: 2` daba 24px).
export const shape = {
  borderRadius: 8,
};

// Valores consistentes de borderRadius para toda la app
export const borderRadius = {
  none: 0,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
} as const;
