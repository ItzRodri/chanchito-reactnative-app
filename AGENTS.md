# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Chanchito — convenciones

- **Estilos:** NativeWind v5 preview + Tailwind v4. Los tokens viven en
  `src/global.css` dentro de `@theme`; su espejo en JS está en
  `src/theme/tokens.ts` (usarlo sólo donde `className` no llega: SVG, Slider,
  StatusBar, interpolaciones de Reanimated). No agregar colores sueltos en JSX.
- **`lightningcss` está pinneado a 1.30.1** en `overrides`. No actualizarlo:
  versiones nuevas rompen el transform de `react-native-css`.
- **Estado:** TanStack Query para datos de servidor, Zustand para estado de
  cliente compartido, `useState` para estado de una sola pantalla. Ver README.
- **Query keys:** siempre desde `src/api/keys.ts` (`qk.*`), nunca strings sueltos.
- **Backend:** `src/api/backend.ts` es un mock en memoria con latencia. Al
  conectar un servidor real, cambiar sólo ese archivo.
- **Fuentes:** en RN cada peso es una familia. Usar las clases `font-display*`
  (Baloo 2) y `font-body*` (Inter), nunca `font-bold`.
- **Rutas:** expo-router con `typedRoutes` activo.
