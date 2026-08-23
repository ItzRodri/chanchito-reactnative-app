import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

import { ChanchitoMascot } from '@/components/chanchito-mascot';
import { Button, Confetti, Pop, Screen } from '@/components/ui';

/** Pantalla de éxito tras entrar a un chanchito. */
export default function JoinedScreen() {
  // `amount` llega ya formateado con su símbolo desde la pantalla anterior.
  const { name, amount } = useLocalSearchParams<{ name: string; amount: string }>();

  return (
    <Screen className="overflow-hidden">
      <Confetti />
      <View className="flex-1 items-center justify-center px-6">
        <Pop>
          <ChanchitoMascot mood="celebrating" size={170} />
        </Pop>
        <Text className="mt-2.5 font-display text-[26px] text-ink">¡Estás dentro!</Text>
        <Text className="mt-1.5 max-w-[240px] text-center font-body text-sm leading-[21px] text-cocoa">
          Pusiste <Text className="font-body-bold text-ink">{amount}</Text> en {name}. Ahora tu
          plata trabaja sola 💪
        </Text>

        <View className="mt-6 w-full">
          <Button
            label="Ver mis chanchitos"
            variant="ink"
            onPress={() => router.replace('/(tabs)/mine')}
          />
        </View>
      </View>
    </Screen>
  );
}
