/**
 * Option colors for poll bars/dots.
 * These are intentionally fixed accent colors (not theme-dependent),
 * so they look good on both dark and light backgrounds.
 * They're saturated enough to read on white AND dark teal.
 */
export const OPTION_COLORS = [
  "#16a34a", // green
  "#0891b2", // cyan
  "#d97706", // amber
  "#dc2626", // red
  "#7c3aed", // violet
  "#0d9488", // teal
] as const;

/** CSS variable shortcuts — safe to use in style props */
export const cssVar = (name: string) => `var(${name})`;
