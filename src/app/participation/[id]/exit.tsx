import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { ChanchitoMascot } from '@/components/chanchito-mascot';
import { BackButton, Button, HardPressable, Screen } from '@/components/ui';
import { useExitParticipation, useParticipation } from '@/api/hooks';
import { money } from '@/lib/money';
import { shortAccount } from '@/lib/pool';
import { colors } from '@/theme/tokens';

export default function ExitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [agree, setAgree] = useState(false);
  const { data: part, isPending } = useParticipation(id);
  const exit = useExitParticipation();

  if (isPending || !part) {
    return (
      <Screen>
        <ActivityIndicator className="mt-16" color={colors.ink} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerClassName="px-[22px] pb-8" showsVerticalScrollIndicator={false}>
        <BackButton onPress={() => router.back()} className="mb-0.5" />

        <View className="items-center">
          <ChanchitoMascot mood="sad" size={130} />
          <Text className="font-display text-[22px] text-ink">¿Seguro que salís?</Text>
        </View>

        <View className="mt-3.5 rounded-[20px] border-[3px] border-ink bg-coral-tint p-4 shadow-hard-coral">
          <View className="flex-row justify-between py-1.5">
            <Text className="font-body-semi text-[13px] text-bark">Recuperás tu capital</Text>
            <Text className="font-display text-[15px] text-mint">{money(part.deposited, { signed: true })}</Text>
          </View>
          <View className="h-0.5 bg-ink opacity-10" />
          <View className="flex-row justify-between py-1.5">
            <Text className="font-body-semi text-[13px] text-bark">Perdés la ganancia</Text>
            <Text className="font-display text-[15px] text-coral">
              {money(-part.yieldEarned)}
            </Text>
          </View>
          <Text className="mt-2 font-body text-[11px] leading-4 text-cocoa">
            Esa ganancia se reparte en partes iguales entre quienes se quedan — no importa cuánto
            puso cada uno. Chanchito se queda un 10% para cubrir los costos de red. Sin letra
            chica.
          </Text>
          <Text className="mt-2 font-body-semi text-[10px] text-clay">
            Tu capital vuelve a {shortAccount(part.account)}
          </Text>
        </View>

        <HardPressable
          accessibilityRole="checkbox"
          accessibilityLabel="Entiendo que pierdo la ganancia generada"
          accessibilityState={{ checked: agree }}
          onPress={() => setAgree((v) => !v)}
          flat
          haptic
          container="mt-4"
          className="flex-row items-center gap-2.5"
        >
          <View
            className={`h-6 w-6 items-center justify-center rounded-[7px] border-[2.5px] border-ink ${
              agree ? 'bg-mint' : 'bg-paper'
            }`}
          >
            {agree && <Text className="font-display text-sm text-white">✓</Text>}
          </View>
          <Text className="flex-1 font-body-semi text-xs leading-4 text-bark">
            Entiendo que pierdo la ganancia generada
          </Text>
        </HardPressable>

        <View className="mt-4">
          <Button
            label="Confirmar salida"
            variant="coral"
            disabled={!agree}
            loading={exit.isPending}
            onPress={() =>
              exit.mutate(part.id, { onSuccess: () => router.replace('/(tabs)/mine') })
            }
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
