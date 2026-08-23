# Chanchito

App de ahorro grupal en cripto. Port completo a React Native del prototipo
`Chanchito App - standalone.html`: los 18 flujos, la mascota y la identidad
visual (Baloo 2 + Inter, borde tinta y sombra dura).

## Stack

| Pieza | Elección | Por qué |
| --- | --- | --- |
| Framework | Expo SDK 57 · RN 0.86 · expo-router | Ya venía en el proyecto |
| Estilos | **NativeWind v5 (preview) + Tailwind v4** | Es la única línea de NativeWind compatible con RN 0.86 / React 19. v4 estable depende de `react-native-css-interop`, que no soporta esta versión de RN |
| Datos de servidor | **TanStack Query v5** | Cache, `isPending`, invalidación por mutación |
| Estado de cliente | **Zustand** | Ver abajo |
| SVG | react-native-svg | Mascota + QR + íconos de tabs |
| Fuentes | `@expo-google-fonts/baloo-2`, `@expo-google-fonts/inter` | Las mismas del mockup |

### Por qué Zustand y no Context

Context sirve para un valor que casi no cambia (tema, sesión). Acá hay estado
que cambia seguido y se lee desde muchas pantallas: los filtros de búsqueda, el
borrador de creación, los flags de demo. Con Context, cada cambio re-renderiza
todo el árbol debajo del provider; con Zustand cada componente se suscribe sólo
al slice que usa (`useSessionStore(s => s.demoAccel)`) y el resto no se entera.
Además no hace falta envolver la app en más providers.

La regla que sigue el proyecto:

- **TanStack Query** → todo lo que vendría de una API: chanchitos, participaciones,
  amigos, solicitudes, notificaciones, stats del perfil.
- **Zustand** → estado que es sólo del cliente: sesión/wallet, onboarding, avatar,
  filtros de búsqueda, formulario de creación, flags de demo.
- **useState** → estado de una sola pantalla (el acordeón de "En curso", el
  slider de monto, el checkbox de salida).

## Estructura

```
src/
  app/                  rutas (expo-router, file-based)
    (tabs)/             home · buscar · mis chanchitos · perfil
    pool/[id]/          detalle + elegir monto
    participation/[id]/ detalle + salida anticipada + completado
    create/             crear + compartir
    friends/            lista + agregar
  api/
    backend.ts          backend simulado en memoria (con latencia)
    hooks.ts            hooks de TanStack Query
    keys.ts             fábrica de query keys
  components/
    ui/                 Button · Card · Chip · ProgressBar · Screen · motion
    chanchito-mascot.tsx  mascota SVG con 5 estados de ánimo
  data/                 dataset y tipos
  store/                slices de Zustand
  theme/tokens.ts       espejo en JS de los tokens de global.css
  global.css            tokens de diseño (@theme de Tailwind v4)
```

## Conectar un backend real

`src/api/backend.ts` es lo único que hay que tocar: reemplazar el cuerpo de cada
función por un `fetch`. Los hooks, las pantallas y las invalidaciones quedan
igual.

## Correr

```bash
npm start          # Metro (Expo Go o dev client)
npm run ios
npm run android
npm run web
```

> `lightningcss` está pinneado a `1.30.1` en `overrides`: versiones más nuevas
> rompen la deserialización que hace `react-native-css` al compilar el CSS.
