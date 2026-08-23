import { router } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';

import { BackButton, Button, Chip, HardPressable, Screen } from '@/components/ui';
import { useCreatePool } from '@/api/hooks';
import { CATEGORIES } from '@/data/db';
import { makeInviteCode } from '@/lib/qr';
import { draftProblem, useDraftStore, type Visibility } from '@/store/draft';
import { colors } from '@/theme/tokens';

function NumberField({
  label,
  value,
  onChange,
  prefix,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  prefix?: string;
}) {
  return (
    <View className="flex-1">
      <Text className="mb-1 font-body-bold text-[11px] text-cocoa">{label}</Text>
      <View className="flex-row items-center rounded-[14px] border-[2.5px] border-ink bg-paper px-3 py-2.5">
        {prefix ? <Text className="font-display text-sm text-clay">{prefix}</Text> : null}
        <TextInput
          value={String(value)}
          onChangeText={(t) => onChange(Number(t.replace(/[^0-9]/g, '')) || 0)}
          keyboardType="number-pad"
          className="min-w-0 flex-1 font-display text-[15px] text-ink"
        />
      </View>
    </View>
  );
}

function VisibilityOption({
  selected,
  onPress,
  emoji,
  emojiBg,
  title,
  body,
  tint,
  border,
}: {
  selected: boolean;
  onPress: () => void;
  emoji: string;
  emojiBg: string;
  title: string;
  body: string;
  tint: string;
  border: string;
}) {
  return (
    <HardPressable
      accessibilityRole="radio"
      accessibilityLabel={title}
      accessibilityState={{ selected }}
      onPress={onPress}
      haptic
      radius={18}
      shadowColor={selected ? colors.ink : 'transparent'}
      className={`flex-row items-start gap-3 rounded-[18px] border-[3px] p-3 ${
        selected ? `${tint} ${border}` : 'border-sand-deep bg-paper'
      }`}
    >
      <View
        className="h-[34px] w-[34px] items-center justify-center rounded-[11px] border-[2.5px] border-ink"
        style={{ backgroundColor: emojiBg }}
      >
        <Text className="text-base">{emoji}</Text>
      </View>
      <View className="flex-1">
        <Text className="font-display text-sm text-ink">{title}</Text>
        <Text className="font-body text-[11px] leading-4 text-bark">{body}</Text>
      </View>
      {selected && (
        <View
          className="h-[22px] w-[22px] items-center justify-center rounded-full border-[2.5px] border-ink"
          style={{ backgroundColor: emojiBg }}
        >
          <Text className="font-display text-xs text-white">✓</Text>
        </View>
      )}
    </HardPressable>
  );
}

export default function CreateScreen() {
  const { draft, patch, reset } = useDraftStore();
  const create = useCreatePool();

  // El formulario arranca limpio cada vez que se entra, como en el mockup.
  useEffect(() => reset(), [reset]);

  const problem = draftProblem(draft);

  function submit() {
    // El código de invitación se genera acá y viaja al contrato: así el mapa
    // código → chanchito queda on-chain y no hace falta un servidor aparte.
    const code = draft.vis === 'private' ? makeInviteCode() : '';
    create.mutate(
      { draft, code },
      {
        onSuccess: (pool) =>
          router.replace({ pathname: '/create/created', params: { id: pool.id, code } }),
      },
    );
  }

  return (
    <Screen>
      <ScrollView
        contentContainerClassName="px-5 pb-8"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <BackButton onPress={() => router.back()} className="mb-1" />

        <Text className="font-display text-[22px] leading-6 text-ink">Creá tu chanchito</Text>
        <Text className="mb-4 font-body-semi text-xs text-clay">
          Poné la meta y elegí quién puede entrar
        </Text>

        <Text className="mb-1.5 font-body-bold text-[11px] text-cocoa">
          ¿Para qué están juntando?
        </Text>
        <TextInput
          value={draft.name}
          onChangeText={(name) => patch({ name })}
          placeholder="Ej: Viaje a Bariloche"
          placeholderTextColor={colors.clay}
          className="w-full rounded-2xl border-[3px] border-ink bg-paper p-3 font-display-bold text-sm text-ink shadow-hard"
        />

        <Text className="mb-1.5 mt-4 font-body-bold text-[11px] text-cocoa">Categoría</Text>
        <View className="flex-row flex-wrap gap-[7px]">
          {CATEGORIES.map((t) => (
            <Chip key={t} label={t} selected={draft.tag === t} onPress={() => patch({ tag: t })} />
          ))}
        </View>

        <View className="mt-4 flex-row gap-2.5">
          <NumberField
            label="Monto mínimo"
            prefix="$"
            value={draft.minWhole}
            onChange={(minWhole) => patch({ minWhole })}
          />
          <NumberField
            label="Monto máximo"
            prefix="$"
            value={draft.maxWhole}
            onChange={(maxWhole) => patch({ maxWhole })}
          />
        </View>

        <View className="mt-3 flex-row gap-2.5">
          <NumberField
            label="Plazo (meses)"
            value={draft.durationMonths}
            onChange={(durationMonths) => patch({ durationMonths })}
          />
          <NumberField
            label="Cupos"
            value={draft.capacity}
            onChange={(capacity) => patch({ capacity })}
          />
        </View>

        <Text className="mb-2 mt-[18px] font-body-bold text-[11px] text-cocoa">
          ¿Quién puede entrar?
        </Text>

        <VisibilityOption
          selected={draft.vis === 'public'}
          onPress={() => patch({ vis: 'public' as Visibility })}
          emoji="🌎"
          emojiBg={colors.mint}
          title="Público"
          body="Aparece en la búsqueda. Cualquiera puede sumarse hasta llenar los cupos."
          tint="bg-mint-tint"
          border="border-mint"
        />

        <View className="mt-2.5">
          <VisibilityOption
            selected={draft.vis === 'private'}
            onPress={() => patch({ vis: 'private' as Visibility })}
            emoji="🔒"
            emojiBg={colors.pink}
            title="Privado"
            body="No se lista en la búsqueda. Solo entran con tu link o escaneando el QR."
            tint="bg-pink-tint"
            border="border-pink"
          />
        </View>

        <View className="mt-5">
          <Button
            label="Crear chanchito"
            disabled={problem !== null}
            loading={create.isPending}
            onPress={submit}
          />
          {problem && (
            <Text className="mt-2 text-center font-body-semi text-[11px] text-clay">
              {problem}
            </Text>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
