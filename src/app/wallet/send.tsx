import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { getAddress, isAddress } from 'viem';

import { useSendUsdt } from '@/api/hooks';
import { useUsdtBalance } from '@/api/use-balance';
import { BackButton, Button, HardPressable, Screen } from '@/components/ui';
import { CHAIN } from '@/lib/chain';
import { money, usdtFromString } from '@/lib/money';
import { shortAccount } from '@/lib/pool';
import { colors } from '@/theme/tokens';

/**
 * Enviar USDT a otra dirección.
 *
 * Las transferencias no se pueden deshacer: una dirección mal escrita es plata
 * perdida. Por eso la pantalla valida el destino antes de habilitar el botón y
 * muestra un resumen de a dónde va, en vez de confiar en que el usuario releyó
 * 42 caracteres.
 */
export default function SendScreen() {
  const balance = useUsdtBalance();
  const send = useSendUsdt();

  const [to, setTo] = useState('');
  const [amountText, setAmountText] = useState('');

  const available = balance.data ?? 0n;

  const destination = useMemo(() => {
    const trimmed = to.trim();
    if (trimmed.length === 0) return { state: 'empty' as const };
    if (!isAddress(trimmed)) return { state: 'invalid' as const };
    return { state: 'valid' as const, address: getAddress(trimmed) };
  }, [to]);

  const amount = useMemo(() => usdtFromString(amountText), [amountText]);

  const tooMuch = amount !== null && amount > available;
  const canSend =
    destination.state === 'valid' && amount !== null && amount > 0n && !tooMuch;

  function submit() {
    if (destination.state !== 'valid' || amount === null) return;
    send.mutate(
      { to: destination.address, amount },
      { onSuccess: () => router.back() },
    );
  }

  return (
    <Screen>
      <ScrollView
        contentContainerClassName="px-5 pb-8"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <BackButton onPress={() => router.back()} className="mb-1" />

        <Text className="font-display text-[22px] leading-7 text-ink">Enviar USDT</Text>
        <Text className="mt-1 font-body-semi text-xs text-clay">
          Tenés {balance.isPending ? '…' : money(available)} disponibles
        </Text>

        {/* -------------------------------- destino ------------------------- */}
        <Text className="mb-1.5 mt-5 font-body-bold text-[11px] text-cocoa">Para</Text>
        <TextInput
          value={to}
          onChangeText={setTo}
          placeholder="0x…"
          placeholderTextColor={colors.clay}
          autoCapitalize="none"
          autoCorrect={false}
          multiline
          className={`w-full rounded-[18px] border-[3px] bg-paper p-3.5 font-body-semi text-[14px] leading-5 text-ink shadow-hard ${
            destination.state === 'invalid' ? 'border-coral' : 'border-ink'
          }`}
        />
        {destination.state === 'invalid' && (
          <Text className="mt-1.5 font-body-bold text-[11px] text-coral">
            Esa no es una dirección válida
          </Text>
        )}

        {/* -------------------------------- monto --------------------------- */}
        <View className="mb-1.5 mt-4 flex-row items-center justify-between">
          <Text className="font-body-bold text-[11px] text-cocoa">Cuánto</Text>
          <HardPressable
            onPress={() => setAmountText((Number(available) / 1e6).toString())}
            flat
            hitSlop={8}
            className="rounded-xl border-2 border-sand-deep px-2.5 py-1"
            accessibilityRole="button"
            accessibilityLabel="Usar todo el saldo"
          >
            <Text className="font-body-bold text-[10px] text-clay">Todo</Text>
          </HardPressable>
        </View>
        <View
          className={`flex-row items-center rounded-[18px] border-[3px] bg-paper px-3.5 py-3 shadow-hard ${
            tooMuch ? 'border-coral' : 'border-ink'
          }`}
        >
          <Text className="font-display text-xl text-clay">$</Text>
          <TextInput
            value={amountText}
            onChangeText={setAmountText}
            placeholder="0,00"
            placeholderTextColor={colors.clay}
            keyboardType="decimal-pad"
            className="ml-1 min-w-0 flex-1 font-display text-xl text-ink"
          />
        </View>
        {tooMuch && (
          <Text className="mt-1.5 font-body-bold text-[11px] text-coral">
            No te alcanza: tenés {money(available)}
          </Text>
        )}

        {/* ------------------------------- resumen -------------------------- */}
        {canSend && destination.state === 'valid' && amount !== null && (
          <View className="mt-5 rounded-[20px] border-[3px] border-ink bg-mint-tint p-4 shadow-hard">
            <View className="flex-row items-center justify-between">
              <Text className="font-body-semi text-xs text-mint-ink">Vas a enviar</Text>
              <Text className="font-display text-base text-ink">{money(amount)}</Text>
            </View>
            <View className="my-2 h-0.5 bg-ink opacity-15" />
            <View className="flex-row items-center justify-between">
              <Text className="font-body-semi text-xs text-mint-ink">A</Text>
              <Text className="font-display-bold text-[13px] text-ink">
                {shortAccount(destination.address)}
              </Text>
            </View>
          </View>
        )}

        <View className="mt-5">
          <Button
            label="Enviar"
            disabled={!canSend}
            loading={send.isPending}
            onPress={submit}
          />
        </View>

        {send.isError && (
          <Text className="mt-3 text-center font-body-bold text-[11px] text-coral">
            No pudimos enviar. Revisá que tengas gas y probá de nuevo.
          </Text>
        )}

        <View className="mt-5 flex-row items-start gap-2.5 rounded-[18px] border-[2.5px] border-ink bg-coral-tint p-3.5">
          <Text className="text-base">⚠️</Text>
          <Text className="flex-1 font-body-semi text-[11.5px] leading-4 text-bark">
            Las transferencias no se pueden deshacer. Revisá la dirección: si está mal, esa plata
            no vuelve. Se envía por la red {CHAIN.name}.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
