/**
 * Espejo en JS de los tokens de `src/global.css`.
 * Se usa donde Tailwind no llega: fills de SVG, props de librerías nativas
 * (Slider, StatusBar), interpolaciones de animación.
 */
export const colors = {
  cream: '#FFF3EC',
  paper: '#FFFFFF',
  ink: '#241713',

  pink: '#FF6FA4',
  pinkSoft: '#FFA6C4',
  pinkDeep: '#D6427E',
  pinkTint: '#FFF0F6',
  pinkCheek: '#FF7CA6',

  mint: '#3ECF8E',
  mintTint: '#EAFAF2',
  mintInk: '#1A5C40',

  coral: '#FF7A59',
  coralTint: '#FFF3EE',

  sun: '#FFD84D',
  sky: '#7FC4FF',

  clay: '#B08B7E',
  cocoa: '#8A6F64',
  bark: '#4A3A37',
  sand: '#F0E2D8',
  sandDeep: '#E2C9BD',
  dust: '#C7B6AD',
  tabIdle: '#8A746C',
} as const;

export const confettiColors = [
  colors.pink,
  colors.mint,
  colors.coral,
  colors.sun,
  colors.sky,
  colors.pinkDeep,
];
