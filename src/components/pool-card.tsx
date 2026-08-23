import { Text, View } from 'react-native';

import type { PoolWithFriends } from '@/api/backend';
import { Avatar, HardPressable, PoolAvatar, ProgressBar, Tag } from '@/components/ui';
import { friendLine } from '@/lib/format';
import { money } from '@/lib/money';
import { poolIsHot, poolMissingLabel, poolProgress, poolSeatsLabel } from '@/lib/pool';

type Props = {
  pool: PoolWithFriends;
  plazoTxt: string;
  onPress: () => void;
};

/** Tarjeta de resultado de búsqueda. */
export function PoolCard({ pool, plazoTxt, onPress }: Props) {
  const progress = poolProgress(pool);

  return (
    <HardPressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${pool.name}`}
      onPress={onPress}
      haptic
      radius={20}
      className="rounded-[20px] border-[3px] border-ink bg-paper p-3"
    >
      <View className="flex-row items-start gap-[11px]">
        <PoolAvatar mood={pool.mood} size={48} />

        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-1.5">
            <Text className="font-display text-[15px] text-ink">{pool.name}</Text>
            {poolIsHot(pool) && <Tag label="🔥" tone="sun" />}
          </View>
          <Text className="font-body-semi text-[10.5px] text-clay">
            {money(pool.min)}–{money(pool.max)} · {plazoTxt}
          </Text>
          <View className="mt-1.5 flex-row gap-1.5">
            <Tag label={pool.tag} />
            <Tag label={poolSeatsLabel(pool)} tone="mint" />
          </View>
        </View>
      </View>

      <View className="mt-2.5">
        <ProgressBar value={progress} height={12} />
      </View>
      <View className="mt-1 flex-row justify-between">
        <Text className="font-display-bold text-[9px] text-ink">panza {progress}%</Text>
        <Text className="font-display-bold text-[9px] text-ink">
          faltan {poolMissingLabel(pool)}
        </Text>
      </View>

      {pool.friends.length > 0 && (
        <View className="mt-2 flex-row items-center gap-2 rounded-[13px] border-2 border-ink bg-cream px-2 py-1.5">
          <View className="flex-row">
            {pool.friends.slice(0, 3).map((f) => (
              <Avatar key={f.id} mood={f.mood} bg={f.bg} size={24} overlap />
            ))}
          </View>
          <Text className="ml-1.5 font-display-bold text-[10px] text-ink">
            {friendLine(pool.friends.map((f) => f.name))}
          </Text>
        </View>
      )}
    </HardPressable>
  );
}
