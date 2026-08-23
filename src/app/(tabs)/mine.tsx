import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';

import { HardPressable, PoolAvatar, ProgressBar, Screen, useRefresh } from '@/components/ui';
import { useParticipations } from '@/api/hooks';
import { money } from '@/lib/money';
import { participationRemainingLabel } from '@/lib/pool';
import { useSessionStore } from '@/store/session';
import { colors } from '@/theme/tokens';

export default function MineScreen() {
  const demoAccel = useSessionStore((s) => s.demoAccel);
  const participations = useParticipations();
  const { data, isPending } = participations;
  const refreshControl = useRefresh(participations);

  return (
    <Screen withTabBar>
      <View className="px-[18px]">
        <Text className="mb-0.5 font-display text-[23px] text-ink">Mis chanchitos</Text>
        <Text className="mb-4 font-body-semi text-xs text-clay">Tu plata, trabajando sola</Text>
      </View>

      {isPending ? (
        <ActivityIndicator className="mt-8" color={colors.ink} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerClassName="gap-3.5 px-[18px] pb-6"
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
          initialNumToRender={6}
          windowSize={7}
          removeClippedSubviews
          ListEmptyComponent={
            <Text className="mt-6 text-center font-body-semi text-xs text-clay">
              Todavía no entraste a ningún chanchito.
            </Text>
          }
          renderItem={({ item }) => (
            <HardPressable
              accessibilityRole="button"
              accessibilityLabel={`Abrir ${item.name}`}
              onPress={() => router.push(`/participation/${item.id}`)}
              haptic
              radius={22}
              offset={{ x: 5, y: 6 }}
              className="rounded-[22px] border-[3px] border-ink bg-paper p-3.5"
            >
              <View className="flex-row items-center gap-3">
                <PoolAvatar mood={item.mood} />
                <View className="flex-1">
                  <Text className="font-display text-base text-ink">{item.name}</Text>
                  <Text className="font-body-semi text-[11px] text-clay">
                    {participationRemainingLabel(item, demoAccel)}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="font-body-semi text-[9px] text-clay">ganancia</Text>
                  <Text className="font-display text-sm text-mint">
                    {money(item.yieldEarned, { signed: true })}
                  </Text>
                </View>
              </View>

              {item.status === 'waiting' && (
                <View className="mt-2 flex-row items-center gap-1.5 self-start rounded-xl border-2 border-ink bg-cream px-2 py-1">
                  <Text className="text-[10px]">⏳</Text>
                  <Text className="font-display-bold text-[9px] text-ink">
                    esperando que se llene
                  </Text>
                </View>
              )}

              <View className="mt-2.5">
                <ProgressBar value={item.progress} height={13} />
              </View>
              <View className="mt-1 flex-row justify-between">
                <Text className="font-display-bold text-[9px] text-ink">panza {item.progress}%</Text>
                <Text className="font-display-bold text-[9px] text-ink">pusiste {money(item.deposited)}</Text>
              </View>
            </HardPressable>
          )}
        />
      )}
    </Screen>
  );
}
