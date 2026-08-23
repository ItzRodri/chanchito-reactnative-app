import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { ChanchitoMascot } from '@/components/chanchito-mascot';
import { BellIcon } from '@/components/tab-icons';
import { Chip, FlatCard, HardPressable, ProgressBar, Screen, useRefresh } from '@/components/ui';
import { useNotifications, usePools } from '@/api/hooks';
import { money } from '@/lib/money';
import { poolIsHot, poolMissingLabel, poolProgress, poolSeatsShort } from '@/lib/pool';
import { usePlazoLabel, useSessionStore } from '@/store/session';
import { colors } from '@/theme/tokens';

export default function HomeScreen() {
  const [runningOpen, setRunningOpen] = useState(false);
  const demoAccel = useSessionStore((s) => s.demoAccel);
  const plazo = usePlazoLabel();

  const pools = usePools();
  const notifications = useNotifications();
  const refreshControl = useRefresh(pools, notifications);

  // El destacado es el de mayor avance; los otros dos, los que siguen.
  // Antes estaban fijos por nombre, lo que dejaba de funcionar en cuanto los
  // chanchitos pasaron a venir de la cadena.
  const ranked = [...(pools.data ?? [])].sort((a, b) => poolProgress(b) - poolProgress(a));
  const featured = ranked[0];
  const mini = ranked[1];
  const running = ranked[2];
  const unread = notifications.data?.length ?? 0;

  return (
    <Screen withTabBar>
      <ScrollView
        contentContainerClassName="px-[18px] pb-6"
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      >
        <View className="mb-3.5 flex-row items-start justify-between">
          <View>
            <Text className="font-body-semi text-xs text-clay">Explorá</Text>
            <Text className="font-display text-[23px] text-ink" style={{ lineHeight: 26 }}>
              Elegí tu{'\n'}chanchito 🐷
            </Text>
          </View>

          <HardPressable
            accessibilityRole="button"
            accessibilityLabel={`Novedades, ${unread} sin leer`}
            onPress={() => router.push('/notifs')}
            haptic
            radius={14}
            offset={{ x: 3, y: 3 }}
            className="h-[42px] w-[42px] items-center justify-center rounded-[14px] border-[2.5px] border-ink bg-paper"
          >
            <BellIcon color={colors.ink} />
            {unread > 0 && (
              <View className="absolute -right-1.5 -top-1.5 h-4 w-4 items-center justify-center rounded-full border-2 border-ink bg-coral">
                <Text className="font-display text-[9px] text-white">{unread}</Text>
              </View>
            )}
          </HardPressable>
        </View>

        {demoAccel && (
          <View className="mb-3 flex-row items-center gap-1.5 rounded-[14px] bg-ink px-3 py-2">
            <Text className="font-display-bold text-[11px] text-sun">⚡ Modo demo acelerado activo</Text>
          </View>
        )}

        <View className="mb-3.5 flex-row gap-2">
          <Chip label="Todos" selected />
          <Chip label="Corto plazo" />
          <Chip label="$ bajo" />
        </View>

        {/* --------------------------- destacado --------------------------- */}
        {pools.isPending && <ActivityIndicator className="my-8" color={colors.ink} />}

        {featured && (
          <HardPressable
            accessibilityRole="button"
            accessibilityLabel={`Abrir ${featured.name}`}
            onPress={() => router.push(`/pool/${featured.id}`)}
            haptic
            radius={24}
            offset={{ x: 5, y: 6 }}
            container="mb-3.5"
            className="overflow-hidden rounded-3xl border-[3px] border-ink bg-mint p-4"
          >
            <View className="flex-row items-start justify-between">
              <View className="flex-1">
                {poolIsHot(featured) && (
                  <View className="flex-row">
                    <Text className="rounded-xl border-2 border-ink bg-paper px-2 py-0.5 font-display-bold text-[10px] text-ink">
                      🔥 casi lleno
                    </Text>
                  </View>
                )}
                <Text className="mt-2 font-display text-xl leading-[21px] text-ink">
                  {featured.name}
                </Text>
                <Text className="font-body-semi text-[11px] text-mint-ink">
                  {money(featured.min)}–{money(featured.max)} ·{' '}
                  {plazo(featured.durationMonths)} · {poolSeatsShort(featured)}
                </Text>
              </View>
              <ChanchitoMascot mood={featured.mood} size={78} />
            </View>

            <View className="mt-3 rounded-2xl border-[2.5px] border-ink bg-paper px-[11px] py-2">
              <View className="mb-1.5 flex-row justify-between">
                <Text className="font-display-bold text-[10px] text-ink">
                  panza al {poolProgress(featured)}%
                </Text>
                <Text className="font-display-bold text-[10px] text-ink">
                  faltan {poolMissingLabel(featured)}
                </Text>
              </View>
              <ProgressBar value={poolProgress(featured)} />
            </View>
          </HardPressable>
        )}

        {!pools.isPending && !featured && (
          <View className="items-center gap-2 rounded-[22px] border-[3px] border-dashed border-sand-deep px-5 py-8">
            <ChanchitoMascot mood="normal" size={90} />
            <Text className="font-display text-base text-ink">Todavía no hay chanchitos</Text>
            <Text className="max-w-[220px] text-center font-body text-xs leading-4 text-cocoa">
              Creá el primero y que se sume tu gente.
            </Text>
          </View>
        )}

        {/* ----------------------------- dos minis -------------------------- */}
        <View className="mb-5 flex-row gap-3">
          {mini && (
            <HardPressable
              accessibilityRole="button"
              accessibilityLabel={`Abrir ${mini.name}`}
              onPress={() => router.push(`/pool/${mini.id}`)}
              haptic
              radius={20}
              container="flex-1"
              className="rounded-[20px] border-[3px] border-ink bg-paper p-3"
            >
              <ChanchitoMascot mood={mini.mood} size={44} />
              <Text className="mt-1.5 font-display text-sm leading-[15px] text-ink">
                {mini.name}
              </Text>
              <View className="mt-2">
                <ProgressBar value={poolProgress(mini)} height={11} striped={false} />
              </View>
              <Text className="mt-1 font-display-bold text-[9px] text-coral">
                {poolSeatsShort(mini)}
              </Text>
            </HardPressable>
          )}

          <HardPressable
            accessibilityRole="button"
            accessibilityLabel="Creá el tuyo"
            onPress={() => router.push('/create')}
            haptic
            flat
            container="flex-1"
            className="min-h-[150px] justify-between rounded-[20px] border-[3px] border-ink bg-ink p-3"
          >
            <Text className="font-display text-[15px] leading-4 text-cream">
              Creá el{'\n'}tuyo
            </Text>
            <Text className="font-body-semi text-[10px] leading-[13px] text-[#d8c3ba]">
              Juntá a tu gente y arrancá una meta nueva.
            </Text>
            <View className="h-8 w-8 items-center justify-center self-start rounded-full border-2 border-cream bg-pink">
              <Text className="font-display text-lg text-white">+</Text>
            </View>
          </HardPressable>
        </View>

        {/* ------------------------------ en curso -------------------------- */}
        <HardPressable
          accessibilityRole="button"
          accessibilityState={{ expanded: runningOpen }}
          onPress={() => setRunningOpen((v) => !v)}
          flat
          hitSlop={8}
          className="mb-2.5 flex-row items-center justify-between"
        >
          <Text className="font-display text-sm text-ink">
            En curso <Text className="font-body-semi text-[11px] text-clay">— solo mirar</Text>
          </Text>
          <Text className="font-display text-base text-clay">{runningOpen ? '▴' : '▾'}</Text>
        </HardPressable>

        {runningOpen && running && (
          <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)}>
            <FlatCard className="flex-row items-center gap-[11px] opacity-90">
            <ChanchitoMascot mood={running.mood} size={38} />
            <View className="flex-1">
              <Text className="font-display-bold text-sm text-ink">{running.name}</Text>
              <Text className="font-body-semi text-[10px] text-clay">
                Cerrado · {poolProgress(running)}% · {poolSeatsShort(running)}
              </Text>
            </View>
            <Text className="rounded-xl border-2 border-ink bg-cream px-2 py-[3px] font-display-bold text-[10px] text-clay">
                corriendo
              </Text>
            </FlatCard>
          </Animated.View>
        )}
      </ScrollView>
    </Screen>
  );
}
