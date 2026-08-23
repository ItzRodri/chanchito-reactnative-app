import { View } from 'react-native';
import type { ReactNode } from 'react';

import { colors } from '@/theme/tokens';
import { HardPressable } from './pressable-hard';

type Props = {
  children: ReactNode;
  onPress?: () => void;
  className?: string;
  /** Clases de layout del contenedor cuando la tarjeta es presionable. */
  container?: string;
};

/** Tarjeta blanca con borde grueso y sombra dura. */
export function Card({ children, onPress, className = '', container = '' }: Props) {
  const surface = `rounded-[22px] border-[3px] border-ink bg-paper p-3.5 ${className}`;

  if (!onPress) {
    return (
      <View className={surface} style={{ boxShadow: `5px 6px 0 ${colors.ink}` }}>
        {children}
      </View>
    );
  }

  return (
    <HardPressable
      onPress={onPress}
      haptic
      radius={22}
      offset={{ x: 5, y: 6 }}
      container={container}
      className={surface}
      accessibilityRole="button"
    >
      {children}
    </HardPressable>
  );
}

/** Variante liviana: sin sombra, borde de 2.5px. */
export function FlatCard({ children, onPress, className = '', container = '' }: Props) {
  const surface = `rounded-[18px] border-[2.5px] border-ink bg-paper p-3 ${className}`;

  if (!onPress) return <View className={surface}>{children}</View>;

  return (
    <HardPressable
      onPress={onPress}
      flat
      radius={18}
      container={container}
      className={surface}
      accessibilityRole="button"
    >
      {children}
    </HardPressable>
  );
}
