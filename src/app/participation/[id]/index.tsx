import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { ChanchitoMascot } from '@/components/chanchito-mascot';
import { BackButton, Bob, Button, ProgressBar, Screen } from '@/components/ui';
import { useCompleteParticipation, useParticipation } from '@/api/hooks';
import { money } from '@/lib/money';
import { participationActiveLabel, participationRemainingLabel, shortAccount } from '@/lib/pool';
import { useSessionStore } from '@/store/session';
import { colors } from '@/theme/tokens';

export default function ParticipationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const demoAccel = useSessionStore((s) => s.demoAccel);
  const { data: part, isPending } = useParticipation(id);
  const complete = useCompleteParticipation();

  if (isPending) {
    return (
      <Screen>
        <ActivityIndicator className="mt-16" color={colors.ink} />
      </Screen>
    );
  }

  if (!part) {
    return (
      <Screen className="px-5">
        <BackButton onPress={() => router.back()} className="mb-2" />
        <Text className="font-display text-lg text-ink">Esta participación ya no existe</Text>
      </Screen>
    );
  }

  const diasTxt = participationRemainingLabel(part, demoAccel);

  return (
    <Screen>
      <ScrollView contentContainerClassName="px-5 pb-8" showsVerticalScrollIndicator={false}>
        <BackButton onPress={() => router.back()} className="mb-1" />

        <View className="items-center">
          <Bob>
            <ChanchitoMascot mood={part.mood} size={120} />
          </Bob>
          <Text className="font-display text-[22px] text-ink">{part.name}</Text>
          <Text className="font-body-semi text-[11px] text-cocoa">{diasTxt}</Text>
        </View>

        <View className="mt-3.5 items-center rounded-[18px] border-[2.5px] border-ink bg-mint-tint p-3.5">
          <Text className="font-body-semi text-[11px] text-mint-ink">
            Tu plata está trabajando sola 💪
          </Text>
          <Text className="mt-0.5 font-display text-3xl text-ink">
            {money(part.deposited)}{' '}
            <Text className="text-sm text-mint">{money(part.yieldEarned, { signed: true })}</Text>
          </Text>
          <Text className="font-body-semi text-[10px] text-[#6a8a7c]">
            depositado · ganancia acumulada
          </Text>
        </View>

        <View className="mt-3 flex-row gap-2.5">
          <View className="flex-1 items-center rounded-2xl border-[2.5px] border-ink bg-paper px-3 py-2.5">
            <Text className="font-display text-lg text-ink">{part.progress}%</Text>
            <Text className="font-body-semi text-[9px] text-clay">panza del grupo</Text>
          </View>
          <View className="flex-1 items-center rounded-2xl border-[2.5px] border-ink bg-paper px-3 py-2.5">
            <Text className="font-display text-lg text-ink">{participationActiveLabel(part)}</Text>
            <Text className="font-body-semi text-[9px] text-clay">siguen activos</Text>
          </View>
        </View>

        <View className="mt-3">
          <ProgressBar value={part.progress} height={14} />
        </View>

        {/* La devolución va a esta misma cuenta: el contrato no permite otra. */}
        <View className="mt-3 flex-row items-center justify-between rounded-[14px] border-2 border-sand-deep px-3 py-2">
          <Text className="font-body-semi text-[10px] text-clay">Depositado desde</Text>
          <Text className="font-display-bold text-[11px] text-ink">
            {shortAccount(part.account)}
          </Text>
        </View>

        <View className="mt-4">
          <Button
            label="🎉 Simular meta cumplida (demo)"
            variant="mint"
            loading={complete.isPending}
            onPress={() =>
              complete.mutate(part.id, {
                onSuccess: () => router.push(`/participation/${part.id}/completed`),
              })
            }
          />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(`/participation/${part.id}/exit`)}
          style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}
          className="mt-4"
        >
          <Text className="text-center font-body-semi text-xs text-clay underline">
            Salir anticipadamente
          </Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
