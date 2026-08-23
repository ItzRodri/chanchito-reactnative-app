import { router } from 'expo-router';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';

import { ChanchitoMascot, type Mood } from '@/components/chanchito-mascot';
import { Avatar, HardPressable, Screen } from '@/components/ui';
import { useProfileStats } from '@/api/hooks';
import {
  useFriendRequestsOnChain,
  useFriendsOnChain,
  useMyUsername,
} from '@/api/social-hooks';
import { useUsdtBalance } from '@/api/use-balance';
import { pluralize } from '@/lib/format';
import { useSessionStore } from '@/store/session';
import { money } from '@/lib/money';
import { shortAccount } from '@/lib/pool';
import { colors } from '@/theme/tokens';

const AVATAR_MOODS: Mood[] = ['normal', 'happy', 'excited', 'celebrating', 'sad'];

function StatTile({
  value,
  label,
  className = '',
  valueClass = 'text-ink',
}: {
  value: string | number;
  label: string;
  className?: string;
  valueClass?: string;
}) {
  return (
    <View
      className={`flex-1 rounded-[18px] border-[3px] border-ink p-3 ${className}`}
      style={{ boxShadow: `3px 4px 0 ${colors.ink}` }}
    >
      <Text className={`font-display text-xl ${valueClass}`}>{value}</Text>
      <Text className="font-body-semi text-[10px] text-clay">{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const {
    handle,
    address,
    walletKind,
    avatar,
    setAvatar,
    demoAccel,
    toggleDemoAccel,
    reduceMotion,
    toggleReduceMotion,
    disconnect,
  } = useSessionStore();
  const balance = useUsdtBalance();

  const stats = useProfileStats();
  const friends = useFriendsOnChain();
  const requests = useFriendRequestsOnChain();
  const myName = useMyUsername();

  const requestCount = requests.data?.length ?? 0;

  function handleDisconnect() {
    disconnect();
    router.replace('/connect');
  }

  return (
    <Screen withTabBar>
      <ScrollView contentContainerClassName="px-5 pb-6" showsVerticalScrollIndicator={false}>
        <Text className="mb-3.5 font-display text-[23px] text-ink">Perfil</Text>

        <View className="items-center gap-2">
          <View className="h-[110px] w-[110px] items-center justify-center rounded-full border-[3px] border-ink bg-cream shadow-hard">
            <ChanchitoMascot mood={avatar} size={88} />
          </View>
          {/* El nombre sale del registro on-chain; sin registrar, invita a elegirlo. */}
          {myName.data ? (
            <Text className="font-display text-xl text-ink">@{myName.data}</Text>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/friends/username')}
              style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}
            >
              <Text className="font-display text-lg text-pink-deep">Elegí tu nombre →</Text>
            </Pressable>
          )}
          <Text className="rounded-xl border-2 border-ink bg-paper px-2.5 py-0.5 font-body-semi text-[11px] text-clay">
            {address ? shortAccount(address) : '—'}
          </Text>
        </View>

        {/* Saldo y cómo cargarlo: lo primero que alguien viene a buscar acá. */}
        <View className="mt-4 flex-row items-center gap-2.5 rounded-[18px] border-[3px] border-ink bg-paper p-3.5 shadow-hard">
          <View className="flex-1">
            <Text className="font-body-semi text-[10px] text-clay">Tu saldo</Text>
            <Text className="font-display text-[22px] text-ink">
              {balance.isPending ? '…' : money(balance.data ?? 0n)}
            </Text>
          </View>
          <HardPressable
            onPress={() => router.push('/wallet/send')}
            flat
            haptic
            className="rounded-2xl border-[2.5px] border-ink bg-paper px-3 py-2.5"
            accessibilityRole="button"
            accessibilityLabel="Enviar USDT"
          >
            <Text className="font-display text-xs text-ink">Enviar ↑</Text>
          </HardPressable>
          <HardPressable
            onPress={() => router.push('/wallet/receive')}
            flat
            haptic
            className="rounded-2xl border-[2.5px] border-ink bg-mint px-3 py-2.5"
            accessibilityRole="button"
            accessibilityLabel="Recibir USDT"
          >
            <Text className="font-display text-xs text-ink">Recibir ↓</Text>
          </HardPressable>
        </View>

        <Text className="my-4 font-display-bold text-xs text-cocoa">Elegí tu avatar</Text>
        <View className="flex-row justify-between gap-2">
          {AVATAR_MOODS.map((m) => (
            <HardPressable
              key={m}
              accessibilityRole="button"
              accessibilityLabel={`Avatar ${m}`}
              accessibilityState={{ selected: avatar === m }}
              onPress={() => setAvatar(m)}
              haptic
              radius={14}
              offset={{ x: 3, y: 4 }}
              shadowColor={avatar === m ? colors.pink : 'transparent'}
              container="flex-1"
              className="aspect-square items-center justify-center rounded-[14px] border-[2.5px] border-ink bg-paper p-1"
            >
              <ChanchitoMascot mood={m} size={40} />
            </HardPressable>
          ))}
        </View>

        <View className="mt-4 flex-row gap-2.5">
          <StatTile
            value={stats.data ? money(stats.data.saved) : '—'}
            label="ahorrado histórico"
            className="bg-mint"
          />
          <StatTile
            value={stats.data ? money(stats.data.earned, { signed: true }) : '—'}
            label="ganancia total"
            className="bg-paper"
            valueClass="text-mint"
          />
        </View>
        <View className="mt-2.5 flex-row gap-2.5">
          <StatTile value={stats.data?.completed ?? '—'} label="completados" className="bg-paper" />
          <StatTile
            value={stats.data?.abandoned ?? '—'}
            label="abandonado"
            className="bg-paper"
            valueClass="text-coral"
          />
        </View>

        <HardPressable
          accessibilityRole="button"
          accessibilityLabel="Mis amigos"
          onPress={() => router.push('/friends')}
          haptic
          radius={18}
          container="mt-4"
          className="flex-row items-center gap-3 rounded-[18px] border-[3px] border-ink bg-paper p-3"
        >
          <View className="flex-row">
            {(friends.data ?? []).slice(0, 4).map((f) => (
              <Avatar key={f.address} mood="happy" bg="#FFE0EC" size={30} overlap />
            ))}
          </View>
          <View className="ml-2.5 flex-1">
            <Text className="font-display text-sm text-ink">Mis amigos</Text>
            <Text className="font-body-semi text-[10.5px] text-clay">
              {pluralize(friends.data?.length ?? 0, 'amigo', 'amigos')} · ahorrá en grupo
            </Text>
          </View>
          {requestCount > 0 && (
            <View className="h-5 w-5 items-center justify-center rounded-full border-2 border-ink bg-coral">
              <Text className="font-display text-[10px] text-white">{requestCount}</Text>
            </View>
          )}
          <Text className="font-display text-[15px] text-clay">›</Text>
        </HardPressable>

        {/* Los props de demo del mockup, ahora como ajustes reales. */}
        <View className="mt-3 overflow-hidden rounded-[18px] border-[2.5px] border-ink bg-paper">
          <View className="flex-row items-center justify-between border-b-2 border-sand px-4 py-3">
            <Text className="font-body-semi text-[13px] text-ink">Modo demo acelerado</Text>
            <Switch
              value={demoAccel}
              onValueChange={toggleDemoAccel}
              trackColor={{ true: colors.mint, false: colors.sand }}
            />
          </View>
          <View className="flex-row items-center justify-between border-b-2 border-sand px-4 py-3">
            <Text className="font-body-semi text-[13px] text-ink">Reducir animaciones</Text>
            <Switch
              value={reduceMotion}
              onValueChange={toggleReduceMotion}
              trackColor={{ true: colors.mint, false: colors.sand }}
            />
          </View>
          {walletKind === 'embedded' && (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/wallet/reveal')}
              className="flex-row items-center justify-between border-b-2 border-sand px-4 py-3.5"
              style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}
            >
              <View className="flex-1">
                <Text className="font-body-semi text-[13px] text-ink">
                  Frase de recuperación
                </Text>
                <Text className="font-body text-[10px] text-clay">
                  Anotala: sin ella perdés el acceso
                </Text>
              </View>
              <Text className="text-clay">›</Text>
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/notifs')}
            style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}
            className="flex-row items-center justify-between border-b-2 border-sand px-4 py-3.5"
          >
            <Text className="font-body-semi text-[13px] text-ink">Notificaciones</Text>
            <Text className="text-clay">›</Text>
          </Pressable>
          <View className="flex-row items-center justify-between border-b-2 border-sand px-4 py-3.5">
            <Text className="font-body-semi text-[13px] text-ink">Ayuda y soporte</Text>
            <Text className="text-clay">›</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={handleDisconnect}
            className="flex-row items-center justify-between px-4 py-3.5"
            style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}>
            <Text className="font-body-semi text-[13px] text-coral">Desconectar wallet</Text>
            <Text className="text-coral">⏻</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}
