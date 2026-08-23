import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { isAddress, getAddress } from 'viem';

import {
  useFriendsOnChain,
  useMyUsername,
  useSendFriendRequestOnChain,
  useUsernameLookup,
  usernameProblem,
} from '@/api/social-hooks';
import { ChanchitoMascot } from '@/components/chanchito-mascot';
import { Avatar, HardPressable, Screen, ScreenHeader } from '@/components/ui';
import { shortAccount } from '@/lib/pool';
import { useSessionStore } from '@/store/session';
import { colors } from '@/theme/tokens';

/**
 * Agregar amigos.
 *
 * Se busca por nombre, que es el punto de todo el registro: nadie va a tipear
 * una dirección de 42 caracteres. Igual se acepta pegar una dirección, porque
 * a veces es lo único que tenés.
 */
export default function AddFriendsScreen() {
  const myAddress = useSessionStore((s) => s.address);
  const myName = useMyUsername();
  const friends = useFriendsOnChain();
  const send = useSendFriendRequestOnChain();

  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const trimmed = query.trim().toLowerCase();
  const pastedAddress = isAddress(trimmed) ? getAddress(trimmed) : null;
  const lookup = useUsernameLookup(pastedAddress ? '' : trimmed);

  const found = pastedAddress ?? lookup.data ?? null;
  const isMe = found && myAddress && found.toLowerCase() === myAddress.toLowerCase();
  const already = found && friends.data?.some((f) => f.address.toLowerCase() === found.toLowerCase());

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const look = found
    ? { seed: parseInt(found.slice(-4), 16) || 0 }
    : { seed: 0 };

  return (
    <Screen>
      <ScrollView
        contentContainerClassName="px-[18px] pb-8"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader title="Agregar amigos" onBack={() => router.back()} className="mb-3" />

        <View className="flex-row items-center gap-2.5 rounded-[18px] border-[3px] border-ink bg-paper px-3 py-2.5 shadow-hard">
          <Text className="text-sm">🔍</Text>
          <Text className="font-display text-base text-clay">@</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="nombre o dirección"
            placeholderTextColor={colors.clay}
            autoCapitalize="none"
            autoCorrect={false}
            className="min-w-0 flex-1 font-body-semi text-[13px] text-ink"
          />
        </View>

        {/* --------------------------- resultado --------------------------- */}
        <View className="mt-4">
          {trimmed.length === 0 ? null : lookup.isFetching ? (
            <Text className="font-body-semi text-[11px] text-clay">Buscando…</Text>
          ) : !pastedAddress && usernameProblem(trimmed) && trimmed.length >= 3 ? (
            <Text className="font-body-bold text-[11px] text-coral">
              {usernameProblem(trimmed)}
            </Text>
          ) : found ? (
            <View className="flex-row items-center gap-3 rounded-[18px] border-[2.5px] border-ink bg-paper px-3 py-2.5">
              <Avatar mood="happy" bg="#FFE0EC" />
              <View className="min-w-0 flex-1">
                <Text className="font-display text-sm text-ink">
                  {pastedAddress ? shortAccount(found) : `@${trimmed}`}
                </Text>
                <Text className="font-body-semi text-[10px] text-clay">
                  {shortAccount(found)}
                </Text>
              </View>

              {isMe ? (
                <Text className="font-body-bold text-[10px] text-clay">sos vos</Text>
              ) : already ? (
                <Text className="rounded-[14px] border-[2.5px] border-ink bg-mint-tint px-3 py-1.5 font-display text-[11px] text-mint-ink">
                  ya son amigos
                </Text>
              ) : (
                <HardPressable
                  onPress={() => send.mutate(found)}
                  flat
                  haptic
                  hitSlop={6}
                  className="rounded-[14px] border-[2.5px] border-ink bg-pink px-3 py-1.5"
                  accessibilityRole="button"
                  accessibilityLabel="Enviar solicitud"
                >
                  <Text className="font-display text-[11px] text-white">Agregar</Text>
                </HardPressable>
              )}
            </View>
          ) : trimmed.length >= 3 ? (
            <View className="items-center gap-2 px-5 py-6">
              <View className="opacity-85">
                <ChanchitoMascot mood="sad" size={90} />
              </View>
              <Text className="font-display text-base text-ink">Nadie con ese nombre</Text>
              <Text className="max-w-[220px] text-center font-body text-xs leading-4 text-cocoa">
                Fijate que esté bien escrito, o pasale tu nombre para que te agregue.
              </Text>
            </View>
          ) : null}
        </View>

        {/* ------------------------- tu propio nombre ---------------------- */}
        <View className="mt-6 rounded-[18px] border-[2.5px] border-ink bg-cream p-3.5">
          <Text className="font-body-bold text-[11px] text-cocoa">Tu nombre</Text>
          {myName.data ? (
            <>
              <Text className="mt-1 font-display text-xl text-pink-deep">@{myName.data}</Text>
              <HardPressable
                onPress={async () => {
                  await Clipboard.setStringAsync(`@${myName.data}`);
                  setCopied(true);
                }}
                flat
                haptic
                container="mt-2.5"
                className={`items-center rounded-2xl border-[2.5px] border-ink p-2.5 ${
                  copied ? 'bg-mint' : 'bg-paper'
                }`}
                accessibilityRole="button"
                accessibilityLabel="Copiar mi nombre"
              >
                <Text className="font-display text-xs text-ink">
                  {copied ? '¡Copiado! ✓' : 'Copiar para compartir'}
                </Text>
              </HardPressable>
            </>
          ) : (
            <>
              <Text className="mt-1 font-body text-[12px] leading-4 text-bark">
                Todavía no elegiste uno. Sin nombre, nadie te puede encontrar.
              </Text>
              <HardPressable
                onPress={() => router.push('/friends/username')}
                flat
                haptic
                container="mt-2.5"
                className="items-center rounded-2xl border-[2.5px] border-ink bg-sun p-2.5"
                accessibilityRole="button"
                accessibilityLabel="Elegir mi nombre"
              >
                <Text className="font-display text-xs text-ink">Elegir mi nombre</Text>
              </HardPressable>
            </>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
