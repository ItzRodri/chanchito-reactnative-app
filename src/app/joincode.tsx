import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { ChanchitoMascot } from '@/components/chanchito-mascot';
import { QrScanner } from '@/components/qr-scanner';
import { BackButton, Bob, Button, Screen } from '@/components/ui';
import { useJoinByCode } from '@/api/hooks';
import { colors } from '@/theme/tokens';

export default function JoinCodeScreen() {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [scanning, setScanning] = useState(false);
  const joinByCode = useJoinByCode();

  function submit() {
    if (code.length !== 6) {
      setError(true);
      return;
    }
    joinByCode.mutate(code, {
      onSuccess: (pool) => {
        if (!pool) {
          setError(true);
          return;
        }
        router.replace(`/pool/${pool.id}`);
      },
      onError: () => setError(true),
    });
  }

  return (
    <Screen className="px-[22px] pb-8">
      <BackButton onPress={() => router.back()} className="mb-1" />

      <View className="flex-1 items-center justify-center gap-1.5">
        <Bob>
          <ChanchitoMascot mood="normal" size={120} />
        </Bob>
        <Text className="text-center font-display text-[21px] leading-6 text-ink">
          Entrá a un{'\n'}chanchito privado
        </Text>
        <Text className="max-w-[230px] text-center font-body text-[12.5px] leading-[18px] text-cocoa">
          Pegá el código de 6 letras que te compartieron
        </Text>

        <TextInput
          value={code}
          onChangeText={(t) => {
            setCode(t.toUpperCase().slice(0, 6));
            setError(false);
          }}
          placeholder="ABC123"
          placeholderTextColor={colors.sandDeep}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={6}
          className={`mt-2.5 w-full rounded-[18px] border-[3px] bg-paper p-4 font-display text-[26px] text-pink-deep shadow-hard ${
            error ? 'border-coral' : 'border-ink'
          }`}
          // El espaciado de letras va por estilo directo: la utilidad
          // `tracking-[Npx]` rompe el render de TextInput en esta versión.
          style={{ letterSpacing: 7, textAlign: 'center' }}
        />

        {error && (
          <Text className="font-body-bold text-[11px] text-coral">
            Ese código no es válido. Son 6 caracteres.
          </Text>
        )}

        <View className="mt-1.5 w-full flex-row items-center gap-2.5">
          <View className="h-0.5 flex-1 bg-sand-deep" />
          <Text className="font-body-bold text-[10px] text-clay">o</Text>
          <View className="h-0.5 flex-1 bg-sand-deep" />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => setScanning(true)}
          className="w-full flex-row items-center justify-center gap-2.5 rounded-2xl bg-ink px-4 py-3"
          style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}>
          <Text className="text-[15px]">📷</Text>
          <Text className="font-display text-[13px] text-cream">Escanear QR</Text>
        </Pressable>
      </View>

      <Button label="Entrar al chanchito" onPress={submit} loading={joinByCode.isPending} />

      <QrScanner
        visible={scanning}
        onClose={() => setScanning(false)}
        onScan={(value) => {
          // El link de invitación es "chanchito.app/j/ABC123": nos quedamos con el código.
          const code = value.split('/').pop() ?? value;
          setCode(code.toUpperCase().slice(0, 6));
          setError(false);
        }}
        title="Escaneá el código del chanchito"
        hint="El que te compartieron por link o QR"
      />
    </Screen>
  );
}
