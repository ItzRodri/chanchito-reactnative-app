import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { ChanchitoMascot } from '@/components/chanchito-mascot';
import { PoolCard } from '@/components/pool-card';
import { Chip, HardPressable, Screen } from '@/components/ui';
import { SearchIcon } from '@/components/tab-icons';
import { usePoolsWithFriendsCount, useSearchResults } from '@/api/hooks';
import { SEARCH_TAGS } from '@/data/db';
import { pluralize } from '@/lib/format';
import { useSearchStore } from '@/store/search';
import { usePlazoLabel } from '@/store/session';
import { colors } from '@/theme/tokens';

export default function SearchScreen() {
  const { query, tag, onlyFriends, setQuery, clearQuery, setTag, toggleOnlyFriends } =
    useSearchStore();
  const plazo = usePlazoLabel();

  const { results, isPending } = useSearchResults({ query, tag, onlyFriends });
  const withFriends = usePoolsWithFriendsCount();

  return (
    <Screen withTabBar>
      <View className="px-[18px]">
        <Text className="font-display text-[23px] leading-6 text-ink">Buscar chanchitos</Text>
        <Text className="mb-3 font-body-semi text-xs text-clay">Encontrá una meta y sumate</Text>

        <View className="flex-row items-center gap-2.5 rounded-[18px] border-[3px] border-ink bg-paper px-3 py-2.5 shadow-hard">
          <SearchIcon color={colors.ink} size={18} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Viaje, notebook, facu…"
            placeholderTextColor={colors.clay}
            className="min-w-0 flex-1 font-body-semi text-sm text-ink"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Limpiar búsqueda"
              hitSlop={8}
              onPress={clearQuery}
              className="h-5 w-5 items-center justify-center rounded-full bg-sand"
              style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}>
              <Text className="font-display text-[11px] text-cocoa">✕</Text>
            </Pressable>
          )}
        </View>

        <HardPressable
          accessibilityRole="switch"
          accessibilityLabel="Donde están mis amigos"
          accessibilityState={{ checked: onlyFriends }}
          onPress={toggleOnlyFriends}
          haptic
          radius={16}
          offset={{ x: 3, y: 4 }}
          shadowColor={onlyFriends ? colors.ink : 'transparent'}
          container="mt-3"
          className={`flex-row items-center gap-2.5 rounded-2xl border-[2.5px] border-ink px-3 py-2 ${
            onlyFriends ? 'bg-pink' : 'bg-paper'
          }`}
        >
          <View className="h-6 w-6 items-center justify-center rounded-full border-2 border-ink bg-paper">
            <Text className="text-xs">👯</Text>
          </View>
          <Text
            className={`flex-1 font-display-bold text-xs ${onlyFriends ? 'text-white' : 'text-ink'}`}
          >
            Donde están mis amigos
          </Text>
          <Text
            className={`font-body-semi text-[10px] opacity-80 ${onlyFriends ? 'text-white' : 'text-ink'}`}
          >
            {withFriends.data === undefined
              ? '…'
              : withFriends.data === 1
                ? '1 con un amigo adentro'
                : `${withFriends.data} con amigos adentro`}
          </Text>
        </HardPressable>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-[7px] py-2.5"
        >
          {SEARCH_TAGS.map((t) => (
            <Chip key={t} label={t} selected={tag === t} onPress={() => setTag(t)} />
          ))}
        </ScrollView>

        <HardPressable
          accessibilityRole="button"
          accessibilityLabel="Entrar con link o QR privado"
          onPress={() => router.push('/joincode')}
          flat
          haptic
          container="mb-2.5"
          className="flex-row items-center gap-2.5 rounded-[15px] bg-ink px-3 py-2.5"
        >
          <View className="h-[26px] w-[26px] items-center justify-center rounded-lg bg-pink">
            <Text className="text-[13px]">🔗</Text>
          </View>
          <Text className="flex-1 font-display-bold text-[11.5px] leading-[15px] text-cream">
            ¿Te pasaron un link o QR privado?
          </Text>
          <Text className="font-display text-sm text-pink">›</Text>
        </HardPressable>

        <View className="flex-row items-center justify-between pb-2">
          <Text className="font-body-bold text-[11px] text-clay">
            {pluralize(results.length, 'chanchito público', 'chanchitos públicos')}
          </Text>
          <Text className="font-body-semi text-[10px] text-dust">los privados no se listan</Text>
        </View>
      </View>

      {isPending ? (
        <ActivityIndicator className="mt-8" color={colors.ink} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerClassName="gap-3 px-[18px] pb-6"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={5}
          windowSize={7}
          removeClippedSubviews
          ListEmptyComponent={
            <View className="items-center gap-2 px-5 py-8">
              <View className="opacity-85">
                <ChanchitoMascot mood="sad" size={110} />
              </View>
              <Text className="font-display text-[17px] text-ink">Nada por acá</Text>
              <Text className="max-w-[210px] text-center font-body text-[12.5px] leading-[18px] text-cocoa">
                Probá con otra palabra o creá tu propio chanchito.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <PoolCard
              pool={item}
              plazoTxt={plazo(item.durationMonths)}
              onPress={() => router.push(`/pool/${item.id}`)}
            />
          )}
        />
      )}
    </Screen>
  );
}
