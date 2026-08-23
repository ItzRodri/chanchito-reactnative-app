import { ActivityIndicator, Text, View } from 'react-native';
import type { ReactNode } from 'react';

import { colors } from '@/theme/tokens';
import { HardPressable } from './pressable-hard';

type Variant = 'pink' | 'ink' | 'mint' | 'coral';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  className?: string;
};

const VARIANTS: Record<Variant, { box: string; text: string; shadow: string; spinner: string }> = {
  pink: { box: 'bg-pink', text: 'text-white', shadow: colors.ink, spinner: colors.ink },
  ink: { box: 'bg-ink', text: 'text-cream', shadow: colors.clay, spinner: colors.cream },
  mint: { box: 'bg-mint', text: 'text-ink', shadow: colors.ink, spinner: colors.ink },
  coral: { box: 'bg-coral', text: 'text-white', shadow: colors.ink, spinner: colors.ink },
};

const DISABLED = { box: 'bg-sand', text: 'text-clay', spinner: colors.clay };

/** Botón principal: borde grueso, sombra dura, y se hunde al apretarlo. */
export function Button({
  label,
  onPress,
  variant = 'pink',
  disabled,
  loading,
  icon,
  className = '',
}: Props) {
  const off = Boolean(disabled || loading);
  const style = off ? DISABLED : VARIANTS[variant];

  return (
    <HardPressable
      onPress={onPress}
      disabled={off}
      haptic
      radius={20}
      shadowColor={off ? 'transparent' : VARIANTS[variant].shadow}
      container={`w-full ${className}`}
      className={`w-full flex-row items-center justify-center gap-2 rounded-[20px] border-[3px] border-ink p-4 ${style.box}`}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: off, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={style.spinner} />
      ) : (
        <>
          {icon ? <View>{icon}</View> : null}
          <Text className={`font-display text-[16px] ${style.text}`}>{label}</Text>
        </>
      )}
    </HardPressable>
  );
}
