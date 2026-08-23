import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { ChanchitoMascot } from '@/components/chanchito-mascot';
import { BackButton, Bob, Button, FlatCard, ProgressBar, Screen } from '@/components/ui';
import { usePool } from '@/api/hooks';
import { usePoolFriends } from '@/api/social-hooks';
import { money } from '@/lib/money';
import {
  poolFailedToFill,
  poolIsWaiting,
  poolJoinLabel,
  poolMissingLabel,
  poolProgress,
  poolSeatsMissing,
  poolTimeLabel,
  shortAccount,
} from '@/lib/pool';
import { usePlazoLabel } from '@/store/session';
import { colors } from '@/theme/tokens';

const RULES = [
  { mark: '✓', color: 'text-mint', text: 'Tu capital nunca se pierde. Si salís antes, lo recuperás completo.' },
  { mark: '!', color: 'text-coral', text: 'Si salís antes, perdés la ganancia generada hasta ese momento.' },
  { mark: '=', color: 'text-ink', text: 'Esa ganancia se reparte en partes iguales entre los que se quedan.' },
  { mark: '◆', color: 'text-ink', text: 'El contrato cuida la plata. Nadie más la toca.' },
];

export default function PoolDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const plazo = usePlazoLabel();
  const { data: pool, isPending } = usePool(id);
  const group = usePoolFriends(id);

  if (isPending) {
    return (
      <Screen>
        <ActivityIndicator className="mt-16" color={colors.ink} />
      </Screen>
    );
  }

  if (!pool) {
    return (
      <Screen className="px-5">
        <BackButton onPress={() => router.back()} className="mb-2" />
        <Text className="font-display text-lg text-ink">No encontramos ese chanchito</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerClassName="px-5 pb-8" showsVerticalScrollIndicator={false}>
        <BackButton onPress={() => router.back()} className="mb-1.5" />

        <View className="items-center gap-1">
          <Bob>
            <ChanchitoMascot mood={pool.mood} size={130} />
          </Bob>
          <Text className="font-display text-2xl text-ink">{pool.name}</Text>
          <Text className="text-center font-body-semi text-xs text-cocoa">{poolJoinLabel(pool)}</Text>
        </View>

        <FlatCard className="mt-3.5">
          <View className="mb-1.5 flex-row justify-between">
            <Text className="font-display-bold text-[11px] text-ink">Panza {poolProgress(pool)}%</Text>
            <Text className="font-display-bold text-[11px] text-ink">faltan {poolMissingLabel(pool)}</Text>
          </View>
          <ProgressBar value={poolProgress(pool)} height={16} />
        </FlatCard>

        {/*
          Mientras faltan cupos, la plata está adentro pero quieta: no genera
          nada y el plazo no arrancó. Decirlo evita la pregunta obvia de por qué
          la ganancia sigue en cero.
        */}
        {poolIsWaiting(pool) && (
          <View className="mt-3 flex-row items-start gap-2.5 rounded-[18px] border-[2.5px] border-ink bg-cream p-3.5">
            <Text className="text-base">⏳</Text>
            <View className="flex-1">
              <Text className="font-display text-[13px] text-ink">
                {poolFailedToFill(pool)
                  ? 'No se llenó a tiempo'
                  : `Faltan ${poolSeatsMissing(pool)} para arrancar`}
              </Text>
              <Text className="mt-0.5 font-body text-[11.5px] leading-4 text-bark">
                {poolFailedToFill(pool)
                  ? 'Nunca llegó a generar. Quien haya puesto plata puede retirarla completa, sin comisión.'
                  : 'La plata espera acá sin generar. Cuando se llenen los cupos arranca el plazo y empieza a rendir.'}
              </Text>
            </View>
          </View>
        )}

        <View className="mt-3 flex-row gap-2.5">
          <View className="flex-1 rounded-2xl border-[2.5px] border-ink bg-cream px-3 py-2.5">
            <Text className="font-body-semi text-[10px] text-clay">Monto</Text>
            <Text className="font-display text-[15px] text-ink">
              {money(pool.min)}–{money(pool.max)}
            </Text>
          </View>
          <View className="flex-1 rounded-2xl border-[2.5px] border-ink bg-cream px-3 py-2.5">
            <Text className="font-body-semi text-[10px] text-clay">
              {poolIsWaiting(pool) ? 'Durará' : 'Plazo'}
            </Text>
            <Text className="font-display text-[15px] text-ink">{plazo(pool.durationMonths)}</Text>
          </View>
        </View>

        {/* Quiénes están adentro. Sale de `participantsList()` del contrato. */}
        {group.participants.length > 0 && (
          <FlatCard className="mt-3 p-3.5">
            <Text className="mb-2 font-display text-[13px] text-ink">
              Quiénes están adentro
            </Text>
            <View className="flex-row flex-wrap gap-1.5">
              {group.participants.map((address) => {
                const friend = group.friends.find(
                  (f) => f.address.toLowerCase() === address.toLowerCase(),
                );
                return (
                  <View
                    key={address}
                    className={`rounded-xl border-2 border-ink px-2.5 py-1 ${
                      friend ? 'bg-mint-tint' : 'bg-cream'
                    }`}
                  >
                    <Text
                      className={`font-display-bold text-[10px] ${
                        friend ? 'text-mint-ink' : 'text-ink'
                      }`}
                    >
                      {friend ? `@${friend.username}` : shortAccount(address)}
                    </Text>
                  </View>
                );
              })}
            </View>
            {group.friends.length > 0 && (
              <Text className="mt-2 font-body-semi text-[10.5px] text-mint-ink">
                {group.friends.length === 1
                  ? `${group.friends[0].username} está acá 👯`
                  : `${group.friends.length} de tus amigos están acá 👯`}
              </Text>
            )}
          </FlatCard>
        )}

        <FlatCard className="mt-3 p-3.5">
          <Text className="mb-1.5 font-display text-[13px] text-ink">Las reglas, claras 🤝</Text>
          {RULES.map((rule) => (
            <View key={rule.mark} className="mb-1.5 flex-row items-start gap-2">
              <Text className={`font-display ${rule.color}`}>{rule.mark}</Text>
              <Text className="flex-1 font-body text-[11.5px] leading-4 text-bark">{rule.text}</Text>
            </View>
          ))}
        </FlatCard>

        <View className="mt-4">
          <Button
            label={
              pool.status === 'active'
                ? 'Ya arrancó'
                : poolFailedToFill(pool)
                  ? 'La inscripción cerró'
                  : 'Unirme a este chanchito'
            }
            disabled={pool.status !== 'waiting' || poolFailedToFill(pool)}
            onPress={() => router.push(`/pool/${pool.id}/amount`)}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
