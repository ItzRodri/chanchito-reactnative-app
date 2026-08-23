import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { markBackedUp, revealMnemonic } from '@/api/wallet';
import { Button, HardPressable, Screen } from '@/components/ui';
import { colors } from '@/theme/tokens';

/**
 * Respaldo de la frase de recuperación.
 *
 * Sin esto la wallet está rota: la app genera una clave, la guarda en el
 * teléfono, y si el teléfono se pierde la plata se pierde con él. Estas 12
 * palabras son la ÚNICA forma de recuperarla.
 *
 * Por eso el paso es obligatorio al crear la wallet, y se puede volver a ver
 * después desde el perfil.
 */
export default function BackupScreen() {
  const [words, setWords] = useState<string[] | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    revealMnemonic().then((phrase) => setWords(phrase ? phrase.split(' ') : []));
  }, []);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  async function copy() {
    if (!words) return;
    await Clipboard.setStringAsync(words.join(' '));
    setCopied(true);
  }

  async function finish() {
    await markBackedUp();
    router.replace('/(tabs)');
  }

  if (!words) {
    return (
      <Screen>
        <ActivityIndicator className="mt-16" color={colors.ink} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerClassName="px-5 pb-8" showsVerticalScrollIndicator={false}>
        <Text className="mt-2 font-display text-[23px] leading-7 text-ink">
          Anotá estas 12 palabras
        </Text>
        <Text className="mt-1.5 font-body text-[13px] leading-5 text-cocoa">
          Son la única forma de recuperar tu plata si perdés el teléfono. Escribilas en papel y
          guardalas en un lugar seguro.
        </Text>

        <View className="mt-4 flex-row items-start gap-2.5 rounded-[18px] border-[2.5px] border-ink bg-coral-tint p-3.5">
          <Text className="text-base">⚠️</Text>
          <Text className="flex-1 font-body-semi text-[11.5px] leading-4 text-bark">
            Nadie de Chanchito te las va a pedir nunca. Quien tenga estas palabras puede sacar
            toda tu plata.
          </Text>
        </View>

        <View className="mt-4 flex-row flex-wrap gap-2">
          {words.map((word, i) => (
            <View
              key={`${word}-${i}`}
              className="w-[31%] flex-row items-center gap-1.5 rounded-[14px] border-[2.5px] border-ink bg-paper px-2.5 py-2.5"
            >
              <Text className="font-body-semi text-[10px] text-clay">{i + 1}</Text>
              <Text className="font-display-bold text-[13px] text-ink">{word}</Text>
            </View>
          ))}
        </View>

        <View className="mt-3">
          <HardPressable
            onPress={copy}
            flat
            haptic
            className={`items-center rounded-2xl border-[2.5px] border-ink p-3 ${
              copied ? 'bg-mint' : 'bg-paper'
            }`}
            accessibilityRole="button"
            accessibilityLabel="Copiar la frase"
          >
            <Text className="font-display text-xs text-ink">
              {copied ? '¡Copiado! ✓' : 'Copiar la frase'}
            </Text>
          </HardPressable>
        </View>

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: confirmed }}
          onPress={() => setConfirmed((v) => !v)}
          className="mt-5 flex-row items-center gap-2.5"
          style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}
        >
          <View
            className={`h-6 w-6 items-center justify-center rounded-[7px] border-[2.5px] border-ink ${
              confirmed ? 'bg-mint' : 'bg-paper'
            }`}
          >
            {confirmed && <Text className="font-display text-sm text-white">✓</Text>}
          </View>
          <Text className="flex-1 font-body-semi text-xs leading-4 text-bark">
            Ya las anoté y entiendo que sin ellas pierdo el acceso
          </Text>
        </Pressable>

        <View className="mt-4">
          <Button label="Listo, empecemos" disabled={!confirmed} onPress={finish} />
        </View>
      </ScrollView>
    </Screen>
  );
}
