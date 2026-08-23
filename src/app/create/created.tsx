import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { ChanchitoMascot } from '@/components/chanchito-mascot';
import { InviteQr } from '@/components/invite-qr';
import { Button, Confetti, HardPressable, Pop, Screen } from '@/components/ui';
import { usePool } from '@/api/hooks';
import { colors } from '@/theme/tokens';

function useCopy(link: string) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);

  async function copy() {
    await Clipboard.setStringAsync(link);
    setCopied(true);
  }

  return { copied, copy, label: copied ? '¡Copiado! ✓' : 'Copiar link' };
}

export default function CreatedScreen() {
  const { id, code: codeParam } = useLocalSearchParams<{ id: string; code?: string }>();
  const { data: pool, isPending } = usePool(id);

  // Con contratos, el código lo genera la pantalla de creación y viaja acá.
  const code = codeParam || pool?.code || '';
  const shareLink = `chanchito.app/j/${code}`;
  const { copied, copy, label } = useCopy(shareLink);

  if (isPending || !pool) {
    return (
      <Screen>
        <ActivityIndicator className="mt-16" color={colors.ink} />
      </Screen>
    );
  }

  const isPublic = pool.visibility === 'public';

  return (
    <Screen>
      <Confetti />
      <ScrollView
        contentContainerClassName="px-5 pb-8 pt-3.5"
        showsVerticalScrollIndicator={false}
      >
        <Pop className="z-10 self-center">
          <ChanchitoMascot mood="celebrating" size={120} />
        </Pop>
        <Text className="z-10 mt-1.5 text-center font-display text-[22px] text-ink">
          ¡Chanchito creado!
        </Text>
        <Text className="z-10 text-center font-body-semi text-[13px] text-cocoa">{pool.name}</Text>

        {isPublic ? (
          <>
            <View className="z-10 mt-4 rounded-[20px] border-[3px] border-ink bg-mint-tint p-4 shadow-hard">
              <View className="mb-2 flex-row items-center gap-2.5">
                <View className="h-7 w-7 items-center justify-center rounded-[9px] border-2 border-ink bg-mint">
                  <Text className="text-sm">🌎</Text>
                </View>
                <Text className="font-display text-sm text-ink">Ya está en la búsqueda</Text>
              </View>
              <Text className="font-body text-[11.5px] leading-[17px] text-bark">
                Cualquiera puede encontrarlo y sumarse hasta llenar los cupos. Te avisamos cada vez
                que entre alguien.
              </Text>
            </View>

            <View className="z-10 mt-3 flex-row gap-2.5">
              <HardPressable
                accessibilityRole="button"
                accessibilityLabel={label}
                onPress={copy}
                flat
                haptic
                container="flex-1"
                className={`items-center rounded-2xl border-[2.5px] border-ink p-3 ${
                  copied ? 'bg-mint' : 'bg-paper'
                }`}
              >
                <Text className="font-display text-xs text-ink">{label}</Text>
              </HardPressable>
              <HardPressable
                accessibilityRole="button"
                accessibilityLabel="Ver en búsqueda"
                onPress={() => router.replace('/(tabs)/search')}
                flat
                haptic
                container="flex-1"
                className="items-center rounded-2xl border-[2.5px] border-ink bg-paper p-3"
              >
                <Text className="font-display text-xs text-ink">Ver en búsqueda</Text>
              </HardPressable>
            </View>
          </>
        ) : (
          <>
            <View className="z-10 mt-4 items-center rounded-[22px] border-[3px] border-ink bg-paper p-4 shadow-hard">
              <View className="mb-3 flex-row items-center gap-2">
                <Text className="text-sm">🔒</Text>
                <Text className="font-display text-[13px] text-ink">Solo por link o QR</Text>
              </View>

              <InviteQr code={code} />

              <Text className="mt-3 font-display text-[22px] tracking-[4px] text-pink-deep">
                {code}
              </Text>
              <Text className="font-body-semi text-[10px] text-clay">código de invitación</Text>

              <Text className="mt-2.5 w-full rounded-[13px] border-2 border-ink bg-cream px-3 py-2 font-body-semi text-[11px] text-ink">
                {shareLink}
              </Text>
            </View>

            <View className="z-10 mt-3 flex-row gap-2.5">
              <HardPressable
                accessibilityRole="button"
                accessibilityLabel={label}
                onPress={copy}
                flat
                haptic
                container="flex-1"
                className={`items-center rounded-2xl border-[2.5px] border-ink p-3 ${
                  copied ? 'bg-mint' : 'bg-paper'
                }`}
              >
                <Text className="font-display text-xs text-ink">{label}</Text>
              </HardPressable>
              <HardPressable
                accessibilityRole="button"
                accessibilityLabel="Compartir"
                onPress={copy}
                flat
                haptic
                container="flex-1"
                className="items-center rounded-2xl border-[2.5px] border-ink bg-pink p-3"
              >
                <Text className="font-display text-xs text-white">Compartir 📤</Text>
              </HardPressable>
            </View>

            <Text className="z-10 mt-2.5 font-body text-[10.5px] leading-[15px] text-clay">
              Cuidá el link: quien lo tenga puede entrar mientras haya cupos.
            </Text>
          </>
        )}

        <View className="z-10 mt-4">
          <Button
            label="Ir a mis chanchitos"
            variant="ink"
            onPress={() => router.replace('/(tabs)/mine')}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
