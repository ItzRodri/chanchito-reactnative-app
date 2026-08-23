import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import type { AccessibilityProps } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { colors } from '@/theme/tokens';

type Offset = { x: number; y: number };

type Props = AccessibilityProps & {
  children: ReactNode;
  onPress?: () => void;
  /** Clases de la superficie (la parte que se hunde). */
  className?: string;
  /** Clases de layout del contenedor (`w-full`, `flex-1`…). */
  container?: string;
  /** Debe coincidir con el radio de la superficie para que la sombra calce. */
  radius?: number;
  /** Cuánto se desplaza la sombra; el press hunde exactamente esto. */
  offset?: Offset;
  shadowColor?: string;
  /** Sin sombra: el press sólo encoge un poco (chips, filas de lista). */
  flat?: boolean;
  disabled?: boolean;
  haptic?: boolean;
  hitSlop?: number;
};

const DEFAULT_OFFSET: Offset = { x: 4, y: 5 };

/**
 * El gesto de toque de Chanchito.
 *
 * La sombra no es un `boxShadow`: es un rectángulo tinta dibujado detrás y
 * corrido `offset`. Al apretar, la superficie se desplaza ese mismo `offset` y
 * tapa el rectángulo, así que la sombra "se aplasta" y el botón se hunde en el
 * papel. Es geometría pura, corre en el hilo de UI y se ve igual en iOS,
 * Android y web.
 */
export function HardPressable({
  children,
  onPress,
  className = '',
  container = '',
  radius = 20,
  offset = DEFAULT_OFFSET,
  shadowColor = colors.ink,
  flat,
  disabled,
  haptic,
  hitSlop,
  ...a11y
}: Props) {
  const pressed = useSharedValue(0);

  const surface = useAnimatedStyle(() =>
    flat
      ? { transform: [{ scale: 1 - pressed.value * 0.04 }], opacity: 1 - pressed.value * 0.12 }
      : {
          transform: [
            { translateX: pressed.value * offset.x },
            { translateY: pressed.value * offset.y },
          ],
        },
  );

  function handlePressIn() {
    pressed.value = withTiming(1, { duration: 70, easing: Easing.out(Easing.quad) });
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }

  function handlePressOut() {
    pressed.value = withTiming(0, { duration: 150, easing: Easing.out(Easing.quad) });
  }

  return (
    <Pressable
      className={`relative ${container}`}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || !onPress}
      hitSlop={hitSlop}
      {...a11y}
    >
      {!flat && !disabled && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: offset.x,
            top: offset.y,
            right: -offset.x,
            bottom: -offset.y,
            borderRadius: radius,
            backgroundColor: shadowColor,
          }}
        />
      )}
      <Animated.View className={className} style={surface}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
