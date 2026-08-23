import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';

import { Screen, ScreenHeader } from '@/components/ui';
import { useNotifications } from '@/api/hooks';
import { colors } from '@/theme/tokens';

const TONES = {
  mint: 'bg-mint-tint',
  paper: 'bg-paper',
  coral: 'bg-coral-tint',
} as const;

export default function NotifsScreen() {
  const { data, isPending } = useNotifications();

  return (
    <Screen>
      <ScreenHeader title="Novedades" onBack={() => router.back()} className="mb-4 px-[18px]" />

      {isPending ? (
        <ActivityIndicator className="mt-8" color={colors.ink} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerClassName="gap-[11px] px-[18px] pb-8"
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View
              className={`flex-row items-center gap-3 rounded-2xl border-[2.5px] border-ink p-3 ${TONES[item.tone]}`}
            >
              <View className="h-9 w-9 items-center justify-center rounded-[11px] border-2 border-ink bg-paper">
                <Text className="text-[17px]">{item.icon}</Text>
              </View>
              <View className="flex-1">
                <Text className="font-display-bold text-[12.5px] leading-4 text-ink">
                  {item.title}
                </Text>
                <Text className="mt-0.5 font-body text-[10px] text-cocoa">{item.time}</Text>
              </View>
            </View>
          )}
        />
      )}
    </Screen>
  );
}
