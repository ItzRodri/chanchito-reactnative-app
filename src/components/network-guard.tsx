import { useAccount, useAppKit } from '@reown/appkit-react-native';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HardPressable } from '@/components/ui';
import { CHAIN } from '@/lib/chain';
import { useSessionStore } from '@/store/session';
import { colors } from '@/theme/tokens';

/**
 * Avisa cuando la wallet externa está en la red equivocada.
 *
 * Con la wallet de la app no puede pasar: siempre firma en la red configurada.
 * Pero una wallet externa tiene su propia red activa, y si está en otra, la app
 * muestra chanchitos que esa wallet no puede ver y la primera transacción falla
 * con un error incomprensible.
 *
 * Es más barato avisar antes que explicar después.
 */
export function NetworkGuard() {
  const insets = useSafeAreaInsets();
  const walletKind = useSessionStore((s) => s.walletKind);
  const { isConnected, chainId } = useAccount();
  const { open } = useAppKit();

  if (walletKind !== 'external' || !isConnected) return null;

  // AppKit devuelve el id con el prefijo del namespace ("eip155:11155111").
  const current = String(chainId ?? '').split(':').pop();
  if (!current || current === String(CHAIN.id)) return null;

  return (
    <View
      pointerEvents="box-none"
      className="absolute left-0 right-0 z-40 px-4"
      style={{ top: insets.top + 6 }}
    >
      <View
        className="flex-row items-center gap-3 rounded-[18px] border-[2.5px] border-ink bg-coral p-3"
        style={{ boxShadow: `3px 4px 0 ${colors.ink}` }}
      >
        <Text className="text-base">⚠️</Text>
        <View className="flex-1">
          <Text className="font-display-bold text-[12px] text-white">Red equivocada</Text>
          <Text className="font-body-semi text-[10px] text-white opacity-90">
            Cambiá tu wallet a {CHAIN.name}
          </Text>
        </View>
        <HardPressable
          onPress={() => open({ view: 'Networks' })}
          flat
          haptic
          className="rounded-xl border-2 border-ink bg-paper px-3 py-1.5"
          accessibilityRole="button"
          accessibilityLabel={`Cambiar a ${CHAIN.name}`}
        >
          <Text className="font-display text-[11px] text-ink">Cambiar</Text>
        </HardPressable>
      </View>
    </View>
  );
}
