import { useEffect } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCurrentTx, useTxStore } from '@/store/tx';
import { colors } from '@/theme/tokens';

/** Cuánto queda visible el "listo" antes de desaparecer solo. */
const SUCCESS_MS = 2_600;

/**
 * Banner global de la operación en curso.
 *
 * Vive en el layout raíz, arriba de todas las pantallas, para que el usuario
 * pueda navegar mientras la transacción se confirma y siga viendo qué pasa.
 */
export function TxBanner() {
  const insets = useSafeAreaInsets();
  const tx = useCurrentTx();
  const dismiss = useTxStore((s) => s.dismiss);

  // El éxito se va solo; el error se queda hasta que lo toquen.
  useEffect(() => {
    if (tx?.status !== 'confirmed') return;
    const timer = setTimeout(() => dismiss(tx.id), SUCCESS_MS);
    return () => clearTimeout(timer);
  }, [tx?.id, tx?.status, dismiss]);

  if (!tx) return null;

  const tone = {
    signing: { bg: 'bg-ink', text: 'text-cream', note: 'Firmá en tu wallet' },
    pending: { bg: 'bg-ink', text: 'text-cream', note: 'Confirmando en la red…' },
    confirmed: { bg: 'bg-mint', text: 'text-ink', note: '¡Listo!' },
    failed: { bg: 'bg-coral', text: 'text-white', note: tx.error ?? 'No se pudo completar' },
  }[tx.status];

  const busy = tx.status === 'signing' || tx.status === 'pending';

  return (
    <Animated.View
      entering={FadeInUp.duration(220)}
      exiting={FadeOutUp.duration(180)}
      pointerEvents="box-none"
      className="absolute left-0 right-0 z-50 px-4"
      style={{ top: insets.top + 6 }}
    >
      <Pressable
        accessibilityRole="alert"
        accessibilityLabel={`${tx.label}. ${tone.note}`}
        onPress={() => !busy && dismiss(tx.id)}
        className={`flex-row items-center gap-3 rounded-[18px] border-[2.5px] border-ink p-3 ${tone.bg}`}
        style={{ boxShadow: `3px 4px 0 ${colors.ink}` }}
      >
        {busy ? (
          <ActivityIndicator size="small" color={colors.pink} />
        ) : (
          <Text className="text-base">{tx.status === 'confirmed' ? '✓' : '⚠️'}</Text>
        )}

        <View className="flex-1">
          <Text className={`font-display-bold text-[12px] ${tone.text}`} numberOfLines={1}>
            {tx.label}
          </Text>
          <Text className={`font-body-semi text-[10px] opacity-80 ${tone.text}`} numberOfLines={1}>
            {tone.note}
          </Text>
        </View>

        {!busy && <Text className={`font-display text-xs ${tone.text}`}>✕</Text>}
      </Pressable>
    </Animated.View>
  );
}
