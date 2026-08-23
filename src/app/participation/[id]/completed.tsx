import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { ChanchitoMascot } from '@/components/chanchito-mascot';
import { Button, Coins, Confetti, Screen, ShakeBreak } from '@/components/ui';
import { useParticipation } from '@/api/hooks';
import { money } from '@/lib/money';
import { participationTotal } from '@/lib/pool';
import { colors } from '@/theme/tokens';

export default function CompletedScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: part, isPending } = useParticipation(id);

  if (isPending || !part) {
    return (
      <Screen>
        <ActivityIndicator className="mt-16" color={colors.ink} />
      </Screen>
    );
  }

  const total = participationTotal(part);

  return (
    <Screen className="overflow-hidden">
      <Confetti />
      <Coins />

      <ScrollView
        contentContainerClassName="items-center px-[22px] pb-8"
        showsVerticalScrollIndicator={false}
      >
        <Text className="z-10 mt-2 font-display text-2xl text-ink">
          ¡Rompimos el chanchito! 🎉
        </Text>

        <ShakeBreak className="z-10 mt-1">
          <ChanchitoMascot mood="celebrating" size={180} />
        </ShakeBreak>

        <View className="z-10 mt-2.5 w-full rounded-[22px] border-[3px] border-ink bg-paper p-4 shadow-hard-lg">
          <View className="flex-row justify-between py-1">
            <Text className="font-body-semi text-[13px] text-cocoa">Tu capital</Text>
            <Text className="font-display text-[15px] text-ink">{money(part.deposited)}</Text>
          </View>
          <View className="flex-row justify-between py-1">
            <Text className="font-body-semi text-[13px] text-cocoa">Ganancia</Text>
            <Text className="font-display text-[15px] text-mint">
              {money(part.yieldEarned, { signed: true })}
            </Text>
          </View>
          <View className="my-1.5 h-0.5 bg-ink opacity-15" />
          <View className="flex-row justify-between py-0.5">
            <Text className="font-display text-sm text-ink">Total a retirar</Text>
            <Text className="font-display text-lg text-pink-deep">{money(total)}</Text>
          </View>
        </View>

        <View className="z-10 mt-3.5 w-full">
          <Button label="Retirar a mi wallet" onPress={() => router.replace('/(tabs)/mine')} />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/(tabs)')}
          style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}
          className="z-10 mt-3"
        >
          <Text className="font-body-bold text-xs text-clay">¿Creamos otro chanchito? →</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
