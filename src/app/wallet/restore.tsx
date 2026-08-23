import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';

import { isValidMnemonic, restoreWallet } from '@/api/wallet';
import { BackButton, Button, Screen } from '@/components/ui';
import { useSessionStore } from '@/store/session';
import { colors } from '@/theme/tokens';

/**
 * Restaurar TU wallet de Chanchito en otro teléfono.
 *
 * Es deliberadamente distinto de "Conectar wallet": acá la frase entra a la
 * app, allá la clave nunca sale de la wallet original. La pantalla lo dice,
 * porque pedir frases semilla es exactamente lo que hacen las apps de phishing
 * y la gente tiene que aprender a desconfiar de eso.
 */
export default function RestoreScreen() {
  const connect = useSessionStore((s) => s.connect);
  const [phrase, setPhrase] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wordCount = useMemo(
    () => phrase.trim().split(/\s+/).filter(Boolean).length,
    [phrase],
  );
  const looksValid = wordCount === 12 && isValidMnemonic(phrase);

  async function restore() {
    setBusy(true);
    setError(null);
    try {
      const { accounts, activeAddress } = await restoreWallet(phrase);
      connect(accounts, activeAddress, 'embedded');
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos restaurar la wallet');
      setBusy(false);
    }
  }

  return (
    <Screen>
      <ScrollView
        contentContainerClassName="px-5 pb-8"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <BackButton onPress={() => router.back()} className="mb-1" />

        <Text className="font-display text-[22px] leading-7 text-ink">
          Restaurá tu wallet
        </Text>
        <Text className="mt-1.5 font-body text-[13px] leading-5 text-cocoa">
          Escribí las 12 palabras que anotaste cuando la creaste, separadas por espacios.
        </Text>

        <TextInput
          value={phrase}
          onChangeText={(t) => {
            setPhrase(t);
            setError(null);
          }}
          placeholder="palabra1 palabra2 palabra3…"
          placeholderTextColor={colors.clay}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
          textAlignVertical="top"
          className="mt-4 h-32 w-full rounded-[18px] border-[3px] border-ink bg-paper p-3.5 font-body-semi text-[15px] leading-6 text-ink shadow-hard"
        />

        <View className="mt-2 flex-row justify-between">
          <Text className="font-body-semi text-[11px] text-clay">
            {wordCount} de 12 palabras
          </Text>
          {wordCount === 12 && (
            <Text
              className={`font-body-bold text-[11px] ${looksValid ? 'text-mint' : 'text-coral'}`}
            >
              {looksValid ? 'frase válida ✓' : 'frase inválida'}
            </Text>
          )}
        </View>

        {error && (
          <Text className="mt-3 font-body-bold text-[11px] text-coral">{error}</Text>
        )}

        <View className="mt-5 flex-row items-start gap-2.5 rounded-[18px] border-[2.5px] border-ink bg-coral-tint p-3.5">
          <Text className="text-base">⚠️</Text>
          <Text className="flex-1 font-body-semi text-[11.5px] leading-4 text-bark">
            Usá esto sólo con la frase de tu propia wallet de Chanchito. Si tu wallet es de otra
            app (MetaMask, Rainbow), volvé y elegí{' '}
            <Text className="font-body-bold">Conectar wallet</Text>: así tu clave nunca sale de
            ahí.
          </Text>
        </View>

        <View className="mt-5">
          <Button
            label="Restaurar"
            disabled={!looksValid}
            loading={busy}
            onPress={restore}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
