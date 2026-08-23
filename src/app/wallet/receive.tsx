import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Share, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { useUsdtBalance } from '@/api/use-balance';
import { BackButton, HardPressable, Screen } from '@/components/ui';
import { CHAIN } from '@/lib/chain';
import { money } from '@/lib/money';
import { shortAccount } from '@/lib/pool';
import { useSessionStore } from '@/store/session';
import { colors } from '@/theme/tokens';

/**
 * Recibir USDT.
 *
 * El QR codifica la dirección tal cual, que es lo que escanean todas las
 * wallets. A propósito NO usa el formato `ethereum:0x…` con monto: ese esquema
 * lo interpretan distinto según la wallet y algunas lo rechazan.
 */
export default function ReceiveScreen() {
  const address = useSessionStore((s) => s.address);
  const balance = useUsdtBalance();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  if (!address) {
    return (
      <Screen className="px-5">
        <BackButton onPress={() => router.back()} className="mb-2" />
        <Text className="font-display text-lg text-ink">Conectá tu wallet primero</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerClassName="px-5 pb-8" showsVerticalScrollIndicator={false}>
        <BackButton onPress={() => router.back()} className="mb-1" />

        <Text className="font-display text-[22px] leading-7 text-ink">Recibir USDT</Text>
        <Text className="mt-1 font-body-semi text-xs text-clay">
          Mostrá este código o pasá tu dirección
        </Text>

        <View className="mt-5 items-center rounded-[22px] border-[3px] border-ink bg-paper p-5 shadow-hard-lg">
          <View className="rounded-[14px] border-[3px] border-ink bg-white p-3">
            <QRCode
              value={address}
              size={190}
              color={colors.ink}
              backgroundColor="#ffffff"
              ecl="M"
            />
          </View>

          <Text className="mt-4 text-center font-display-bold text-[13px] leading-5 text-ink">
            {address.slice(0, 21)}
            {'\n'}
            {address.slice(21)}
          </Text>
          <Text className="mt-1 font-body-semi text-[10px] text-clay">
            tu dirección en {CHAIN.name}
          </Text>
        </View>

        <View className="mt-3 flex-row gap-2.5">
          <HardPressable
            onPress={async () => {
              await Clipboard.setStringAsync(address);
              setCopied(true);
            }}
            flat
            haptic
            container="flex-1"
            className={`items-center rounded-2xl border-[2.5px] border-ink p-3 ${
              copied ? 'bg-mint' : 'bg-paper'
            }`}
            accessibilityRole="button"
            accessibilityLabel="Copiar dirección"
          >
            <Text className="font-display text-xs text-ink">
              {copied ? '¡Copiada! ✓' : 'Copiar dirección'}
            </Text>
          </HardPressable>

          <HardPressable
            onPress={() => Share.share({ message: address })}
            flat
            haptic
            container="flex-1"
            className="items-center rounded-2xl border-[2.5px] border-ink bg-pink p-3"
            accessibilityRole="button"
            accessibilityLabel="Compartir dirección"
          >
            <Text className="font-display text-xs text-white">Compartir 📤</Text>
          </HardPressable>
        </View>

        <View className="mt-4 rounded-[18px] border-[2.5px] border-ink bg-mint-tint p-3.5">
          <View className="flex-row items-center justify-between">
            <Text className="font-body-semi text-xs text-mint-ink">Tenés ahora</Text>
            <Text className="font-display text-base text-ink">
              {balance.isPending ? '…' : money(balance.data ?? 0n)}
            </Text>
          </View>
        </View>

        <View className="mt-4 flex-row items-start gap-2.5 rounded-[18px] border-[2.5px] border-ink bg-coral-tint p-3.5">
          <Text className="text-base">⚠️</Text>
          <Text className="flex-1 font-body-semi text-[11.5px] leading-4 text-bark">
            Mandá sólo USDT por la red {CHAIN.name}. Si te mandan otra moneda o por otra red, esos
            fondos se pierden.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
