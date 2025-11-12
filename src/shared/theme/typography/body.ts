// Typography for body text and UI elements
export const body = {
  // Primary body text - main content
  body1: {
    fontSize: '1rem', // 16px
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: '0.01em',
  },
  // Secondary body text - less prominent content
  body2: {
    fontSize: '0.875rem', // 14px
    fontWeight: 400,
    lineHeight: 1.43,
    letterSpacing: '0.01em',
  },
  // Small text - captions, helper text
  caption: {
    fontSize: '0.75rem', // 12px
    fontWeight: 400,
    lineHeight: 1.66,
    letterSpacing: '0.03em',
  },
  // Extra small text - fine print
  overline: {
    fontSize: '0.6875rem', // 11px
    fontWeight: 500,
    lineHeight: 1.6,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
  },
};