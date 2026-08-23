import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HardPressable } from './pressable-hard';

type ScreenProps = {
  children: ReactNode;
  className?: string;
  /** Deja lugar abajo para la tab bar. */
  withTabBar?: boolean;
};

/**
 * Contenedor de pantalla: fondo crema opaco y safe area.
 *
 * A propósito NO tiene animación de entrada. El stack nativo ya anima la
 * transición; superponerle un fade dejaba la pantalla en `opacity: 0` durante
 * 300 ms y se veía el fondo de la ventana — el "blanco" al navegar.
 */
export function Screen({ children, className = '', withTabBar }: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className={`flex-1 bg-cream ${className}`}
      style={{ paddingTop: insets.top, paddingBottom: withTabBar ? 0 : insets.bottom }}
    >
      {children}
    </View>
  );
}

/** Flecha de volver, idéntica al "←" del mockup. */
export function BackButton({ onPress, className = '' }: { onPress: () => void; className?: string }) {
  return (
    <HardPressable
      onPress={onPress}
      flat
      hitSlop={14}
      container={className}
      className="h-9 w-9 justify-center"
      accessibilityRole="button"
      accessibilityLabel="Volver"
    >
      <Text className="font-display-bold text-xl text-ink">←</Text>
    </HardPressable>
  );
}

/** Encabezado "← Título". */
export function ScreenHeader({
  title,
  onBack,
  className = '',
}: {
  title: string;
  onBack?: () => void;
  className?: string;
}) {
  return (
    <View className={`flex-row items-center gap-2 ${className}`}>
      {onBack ? <BackButton onPress={onBack} /> : null}
      <Text className="font-display text-[21px] text-ink">{title}</Text>
    </View>
  );
}
