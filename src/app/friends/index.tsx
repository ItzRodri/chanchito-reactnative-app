import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import {
  SOCIAL_ENABLED,
  useAcceptFriendOnChain,
  useFriendRequestsOnChain,
  useFriendsOnChain,
  useMyUsername,
  useRejectFriendOnChain,
  useRemoveFriendOnChain,
} from '@/api/social-hooks';
import { Avatar, Button, HardPressable, Screen, ScreenHeader, useRefresh } from '@/components/ui';
import { pluralize } from '@/lib/format';
import { shortAccount } from '@/lib/pool';
import type { Mood } from '@/components/chanchito-mascot';
import { colors } from '@/theme/tokens';

/** Sin foto de perfil, el avatar se deriva de la dirección: siempre el mismo. */
const MOODS: Mood[] = ['normal', 'happy', 'excited', 'celebrating'];
const BGS = ['#FFE0EC', '#E0F5EC', '#FFEDD9', '#E6EEFF', '#F3E5FF', '#FFE5E0'];

function avatarFor(address: string) {
  const seed = parseInt(address.slice(-4), 16) || 0;
  return { mood: MOODS[seed % MOODS.length], bg: BGS[seed % BGS.length] };
}

export default function FriendsScreen() {
  const myName = useMyUsername();
  const friends = useFriendsOnChain();
  const requests = useFriendRequestsOnChain();
  const accept = useAcceptFriendOnChain();
  const reject = useRejectFriendOnChain();
  const remove = useRemoveFriendOnChain();
  const refreshControl = useRefresh(friends, requests, myName);

  if (!SOCIAL_ENABLED) {
    return (
      <Screen className="px-[18px]">
        <ScreenHeader title="Mis amigos" onBack={() => router.back()} className="mb-4" />
        <Text className="font-body text-[13px] leading-5 text-cocoa">
          Falta configurar el registro social. Agregá
          EXPO_PUBLIC_SOCIAL_REGISTRY_ADDRESS al .env.
        </Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        contentContainerClassName="px-[18px] pb-8"
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      >
        <ScreenHeader title="Mis amigos" onBack={() => router.back()} className="mb-1" />
        <Text className="mb-3.5 font-body-semi text-xs text-clay">
          {pluralize(friends.data?.length ?? 0, 'amigo', 'amigos')}
          {myName.data ? ` · sos @${myName.data}` : ''}
        </Text>

        {/* Sin nombre no te pueden encontrar: es lo primero que hay que resolver. */}
        {!myName.isPending && !myName.data && (
          <HardPressable
            onPress={() => router.push('/friends/username')}
            haptic
            radius={18}
            container="mb-4"
            className="flex-row items-center gap-3 rounded-[18px] border-[3px] border-ink bg-sun p-3.5"
            accessibilityRole="button"
            accessibilityLabel="Elegir mi nombre de usuario"
          >
            <Text className="text-lg">👋</Text>
            <View className="flex-1">
              <Text className="font-display text-sm text-ink">Elegí tu nombre</Text>
              <Text className="font-body text-[11px] leading-4 text-bark">
                Sin un nombre, tus amigos no te pueden encontrar.
              </Text>
            </View>
            <Text className="font-display text-[15px] text-ink">›</Text>
          </HardPressable>
        )}

        {(requests.data?.length ?? 0) > 0 && (
          <>
            <Text className="mb-2 font-display text-xs text-ink">Te quieren agregar</Text>
            <View className="mb-[18px] gap-2.5">
              {requests.data!.map((p) => {
                const look = avatarFor(p.address);
                return (
                  <View
                    key={p.address}
                    className="flex-row items-center gap-3 rounded-[18px] border-[3px] border-ink bg-coral-tint p-3 shadow-hard-coral"
                  >
                    <Avatar mood={look.mood} bg={look.bg} />
                    <View className="min-w-0 flex-1">
                      <Text className="font-display text-sm text-ink">@{p.username}</Text>
                      <Text className="font-body-semi text-[10px] text-clay">
                        {shortAccount(p.address)}
                      </Text>
                    </View>
                    <HardPressable
                      onPress={() => reject.mutate(p.address)}
                      flat
                      haptic
                      hitSlop={6}
                      className="h-[30px] w-[30px] items-center justify-center rounded-[10px] border-[2.5px] border-ink bg-paper"
                      accessibilityRole="button"
                      accessibilityLabel={`Rechazar a ${p.username}`}
                    >
                      <Text className="font-display text-xs text-cocoa">✕</Text>
                    </HardPressable>
                    <HardPressable
                      onPress={() => accept.mutate(p.address)}
                      flat
                      haptic
                      hitSlop={6}
                      className="h-[30px] w-[30px] items-center justify-center rounded-[10px] border-[2.5px] border-ink bg-mint"
                      accessibilityRole="button"
                      accessibilityLabel={`Aceptar a ${p.username}`}
                    >
                      <Text className="font-display text-[13px] text-white">✓</Text>
                    </HardPressable>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {friends.isPending ? (
          <ActivityIndicator className="mt-6" color={colors.ink} />
        ) : friends.data!.length === 0 ? (
          <View className="items-center gap-2 rounded-[22px] border-[3px] border-dashed border-sand-deep px-5 py-8">
            <Text className="font-display text-base text-ink">Todavía no tenés amigos acá</Text>
            <Text className="max-w-[230px] text-center font-body text-xs leading-4 text-cocoa">
              Buscá a alguien por su nombre y mandale una solicitud.
            </Text>
          </View>
        ) : (
          <View className="gap-2.5">
            {friends.data!.map((f) => {
              const look = avatarFor(f.address);
              return (
                <View
                  key={f.address}
                  className="flex-row items-center gap-3 rounded-[18px] border-[2.5px] border-ink bg-paper px-3 py-2.5"
                >
                  <Avatar mood={look.mood} bg={look.bg} />
                  <View className="min-w-0 flex-1">
                    <Text className="font-display text-sm text-ink">@{f.username}</Text>
                    <Text className="font-body-semi text-[10px] text-clay">
                      {shortAccount(f.address)}
                    </Text>
                  </View>
                  <HardPressable
                    onPress={() => remove.mutate(f.address)}
                    flat
                    hitSlop={6}
                    className="rounded-xl border-2 border-sand-deep px-2.5 py-1"
                    accessibilityRole="button"
                    accessibilityLabel={`Quitar a ${f.username}`}
                  >
                    <Text className="font-body-bold text-[10px] text-clay">Quitar</Text>
                  </HardPressable>
                </View>
              );
            })}
          </View>
        )}

        <View className="mt-[18px]">
          <Button label="+ Agregar amigos" onPress={() => router.push('/friends/add')} />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/(tabs)/search')}
          className="mt-3.5"
          style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}
        >
          <Text className="text-center font-body-bold text-xs text-pink-deep">
            Ver chanchitos donde están mis amigos →
          </Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
