import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ChanchitoMascot } from '@/components/chanchito-mascot';
import { Bob, Button, Screen } from '@/components/ui';
import { ONBOARDING } from '@/data/db';
import { useSessionStore } from '@/store/session';

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const finishOnboarding = useSessionStore((s) => s.finishOnboarding);
  const slide = ONBOARDING[index];
  const isLast = index === ONBOARDING.length - 1;

  function finish() {
    finishOnboarding();
    router.replace('/connect');
  }

  return (
    <Screen className="px-6 pb-8">
      <View className="items-end pt-2">
        <Pressable accessibilityRole="button" hitSlop={10} onPress={finish}
          style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}>
          <Text className="font-body-semi text-xs text-clay">Saltar</Text>
        </Pressable>
      </View>

      <View className="flex-1 items-center justify-center gap-2.5">
        <Bob>
          <ChanchitoMascot mood={slide.mood} size={190} />
        </Bob>
        <Text className="max-w-[250px] text-center font-display text-[26px] leading-tight text-ink">
          {slide.title}
        </Text>
        <Text className="max-w-[250px] text-center font-body text-sm leading-[21px] text-cocoa">
          {slide.body}
        </Text>
      </View>

      <View className="mb-5 flex-row justify-center gap-[7px]">
        {ONBOARDING.map((_, i) => (
          <View
            key={i}
            className={`h-[9px] rounded-md ${i === index ? 'w-[22px] bg-pink' : 'w-[9px] bg-sand-deep'}`}
          />
        ))}
      </View>

      <Button
        label={isLast ? 'Empezar' : 'Siguiente'}
        onPress={() => (isLast ? finish() : setIndex(index + 1))}
      />
    </Screen>
  );
}
