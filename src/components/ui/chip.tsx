import { Text } from 'react-native';

import { HardPressable } from './pressable-hard';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

/** Pill de filtro/categoría. Seleccionada = fondo tinta. */
export function Chip({ label, selected, onPress }: Props) {
  return (
    <HardPressable
      onPress={onPress}
      flat
      hitSlop={6}
      className={`rounded-2xl border-2 border-ink px-3 py-1.5 ${selected ? 'bg-ink' : 'bg-paper'}`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      <Text className={`font-display-bold text-xs ${selected ? 'text-cream' : 'text-ink'}`}>
        {label}
      </Text>
    </HardPressable>
  );
}

/** Etiqueta chica no interactiva (tags dentro de las tarjetas). */
export function Tag({ label, tone = 'cream' }: { label: string; tone?: 'cream' | 'mint' | 'sun' }) {
  const tones = { cream: 'bg-cream', mint: 'bg-mint-tint', sun: 'bg-sun' } as const;
  const text = tone === 'mint' ? 'text-mint-ink' : 'text-ink';

  return (
    <Text
      className={`rounded-[10px] border-[1.5px] border-ink px-1.5 py-0.5 font-display-bold text-[9px] ${tones[tone]} ${text}`}
    >
      {label}
    </Text>
  );
}
