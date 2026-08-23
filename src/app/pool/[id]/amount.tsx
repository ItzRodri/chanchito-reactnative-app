import Slider from '@react-native-community/slider';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { BackButton, Button, Screen } from '@/components/ui';
import { useJoinPool, usePool } from '@/api/hooks';
import { useUsdtBalance } from '@/api/use-balance';
import { useDepositGasQuote } from '@/api/use-gas-quote';
import { estimateYield, formatBps, money, usdtFromWhole, usdtToWhole } from '@/lib/money';
import { colors } from '@/theme/tokens';

export default function AmountScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: pool, isPending } = usePool(id);
  const join = useJoinPool();
  const balance = useUsdtBalance();

  /**
   * El slider trabaja en dólares enteros porque es lo que el usuario elige.
   * La conversión a unidades base pasa una sola vez, acá abajo.
   */
  const [whole, setWhole] = useState<number | null>(null);

  // Cotización de la comisión de red, en USD₮, para mostrarla antes de firmar.
  const gasQuote = useDepositGasQuote(id, usdtFromWhole(whole ?? 0));

  useEffect(() => {
    if (pool && whole === null) setWhole(usdtToWhole(pool.min));
  }, [pool, whole]);

  if (isPending || !pool || whole === null) {
    return (
      <Screen>
        <ActivityIndicator className="mt-16" color={colors.ink} />
      </Screen>
    );
  }

  const amount = usdtFromWhole(whole);
  const gain = estimateYield(amount, pool.aprBps, pool.durationMonths);

  // Si no alcanza, el botón se apaga acá en vez de que la transacción revierta
  // en la red con un error que el usuario no puede interpretar.
  const available = balance.data ?? 0n;
  const notEnough = balance.isSuccess && available < amount;

  function confirm() {
    join.mutate(
      { poolId: pool!.id, amount },
      {
        onSuccess: () =>
          router.replace({
            pathname: '/joined',
            params: { name: pool!.name, amount: money(amount) },
          }),
      },
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerClassName="px-[22px] pb-8" showsVerticalScrollIndicator={false}>
        <BackButton onPress={() => router.back()} className="mb-2" />

        <Text className="font-display text-[22px] leading-6 text-ink">¿Cuánto ponés?</Text>
        <Text className="mb-5 font-body-semi text-xs text-cocoa">
          {pool.name} · entre {money(pool.min)} y {money(pool.max)}
        </Text>

        <Text className="mb-1 text-center font-display text-[46px] text-pink-deep">
          {money(amount)}
        </Text>
        <Text
          className={`mb-2 text-center font-body-semi text-[11px] ${
            notEnough ? 'text-coral' : 'text-clay'
          }`}
        >
          {balance.isPending
            ? 'Consultando tu saldo…'
            : `Tenés ${money(available)} disponibles`}
        </Text>

        <Slider
          value={whole}
          minimumValue={usdtToWhole(pool.min)}
          maximumValue={usdtToWhole(pool.max)}
          step={1}
          onValueChange={setWhole}
          minimumTrackTintColor={colors.pink}
          maximumTrackTintColor={colors.sand}
          thumbTintColor={colors.paper}
          accessibilityLabel="Monto a depositar"
        />

        <View className="mb-5 flex-row justify-between">
          <Text className="font-body-semi text-[11px] text-clay">{money(pool.min)}</Text>
          <Text className="font-body-semi text-[11px] text-clay">{money(pool.max)}</Text>
        </View>

        <View className="rounded-[20px] border-[3px] border-ink bg-mint-tint p-4 shadow-hard">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="font-body-semi text-xs text-mint-ink">Vas a poner</Text>
            <Text className="font-display text-base text-ink">{money(amount)}</Text>
          </View>
          <View className="mb-2 h-0.5 bg-ink opacity-15" />
          <View className="flex-row items-center justify-between">
            <Text className="flex-1 font-body-semi text-xs text-mint-ink">
              Ganancia estimada si se cumple 🎉
            </Text>
            <Text className="font-display text-base text-mint">~{money(gain)}</Text>
          </View>
          <Text className="mt-1.5 font-body text-[10px] text-[#6a8a7c]">
            Estimado a la tasa actual ({formatBps(pool.aprBps)} anual). No es una promesa.
          </Text>
        </View>

        {/*
          La comisión de red, cobrada en USD₮.
          El usuario nunca necesita tener ETH: el paymaster cubre el gas y se
          cobra en el mismo token que está ahorrando.
        */}
        <View className="mt-3 flex-row items-center gap-2.5 rounded-[18px] border-[2.5px] border-ink bg-cream px-3.5 py-3">
          <Text className="text-base">⛽</Text>
          <View className="flex-1">
            <Text className="font-body-semi text-[11px] text-ink">Comisión de red</Text>
            <Text className="font-body text-[10px] text-cocoa">
              Se paga en USD₮. No necesitás ETH.
            </Text>
          </View>
          <Text className="font-display text-sm text-ink">
            {gasQuote.isPending
              ? '…'
              : gasQuote.data !== undefined
                ? money(gasQuote.data)
                : '—'}
          </Text>
        </View>

        <View className="mt-4">
          <Button
            label="Confirmar depósito"
            onPress={confirm}
            loading={join.isPending}
            disabled={notEnough}
          />
        </View>
        <Text
          className={`mt-2.5 text-center font-body text-[11px] ${
            notEnough ? 'font-body-bold text-coral' : 'text-clay'
          }`}
        >
          {notEnough
            ? `Te faltan ${money(amount - available)} en esta cuenta`
            : 'Vas a firmar la transacción en tu wallet'}
        </Text>

        {join.isError && (
          <Text className="mt-3 text-center font-body-bold text-[11px] text-coral">
            No pudimos confirmar el depósito. Probá de nuevo.
          </Text>
        )}
      </ScrollView>
    </Screen>
  );
}
