import { useMemo } from 'react';
import { View } from 'react-native';

type Props = {
  /** 0-100 */
  value: number;
  /** alto de la barra en px */
  height?: number;
  /** rayado diagonal como en el mockup; `false` = relleno liso */
  striped?: boolean;
};

/** Ancho de cada raya + su separación. */
const STRIPE_PITCH = 16;
/** Suficiente para cubrir el ancho de pantalla más común. */
const MAX_STRIPES = 26;

/**
 * "La panza del chanchito". Reemplaza el
 * `repeating-linear-gradient(45deg, ...)` del HTML por barras inclinadas,
 * que es lo que rinde nativo sin dependencias de gradientes.
 */
export function ProgressBar({ value, height = 15, striped = true }: Props) {
  const pct = Math.max(0, Math.min(100, value));

  // Sólo se montan las rayas que entran en la parte llena: en una lista de
  // resultados esto es la diferencia entre 26 vistas por barra y unas pocas.
  const stripes = useMemo(
    () => (striped ? Math.ceil((MAX_STRIPES * pct) / 100) + 2 : 0),
    [striped, pct],
  );

  return (
    <View className="overflow-hidden rounded-[10px] border-2 border-ink bg-cream" style={{ height }}>
      <View className="h-full overflow-hidden bg-pink" style={{ width: `${pct}%` }}>
        {stripes > 0 && (
          <View className="absolute inset-0 flex-row overflow-hidden">
            {Array.from({ length: stripes }).map((_, i) => (
              <View
                key={i}
                className="h-[200%] w-2 bg-pink-soft"
                style={{ marginRight: STRIPE_PITCH / 2, transform: [{ skewX: '-45deg' }] }}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
