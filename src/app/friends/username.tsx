import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';

import {
  useMyUsername,
  useRegisterUsername,
  useUsernameLookup,
  usernameProblem,
} from '@/api/social-hooks';
import { BackButton, Button, Screen } from '@/components/ui';
import { colors } from '@/theme/tokens';

/**
 * Elegir el nombre de usuario.
 *
 * Es lo que hace usable a los amigos: sin esto habría que intercambiar
 * direcciones de 42 caracteres. El contrato lo guarda una sola vez y no deja
 * cambiarlo, así que la pantalla lo avisa antes.
 */
export default function UsernameScreen() {
  const current = useMyUsername();
  const register = useRegisterUsername();
  const [name, setName] = useState('');

  const problem = useMemo(() => (name.length === 0 ? null : usernameProblem(name)), [name]);
  const taken = useUsernameLookup(name);

  const isTaken = Boolean(taken.data);
  const canSubmit = name.length >= 3 && !problem && !isTaken && !taken.isFetching;

  if (current.data) {
    return (
      <Screen className="px-5">
        <BackButton onPress={() => router.back()} className="mb-2" />
        <Text className="font-display text-[22px] text-ink">Tu nombre</Text>
        <View className="mt-4 items-center rounded-[20px] border-[3px] border-ink bg-paper p-5 shadow-hard">
          <Text className="font-display text-2xl text-pink-deep">@{current.data}</Text>
          <Text className="mt-2 text-center font-body text-[11.5px] leading-4 text-cocoa">
            Los nombres no se pueden cambiar: si se liberara el tuyo, alguien podría quedarse con
            una identidad que tu gente ya conoce.
          </Text>
        </View>
      </Screen>
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

        <Text className="font-display text-[22px] leading-7 text-ink">Elegí tu nombre</Text>
        <Text className="mt-1.5 font-body text-[13px] leading-5 text-cocoa">
          Así te encuentran tus amigos, sin tener que pasarse direcciones largas.
        </Text>

        <View
          className={`mt-5 flex-row items-center rounded-[18px] border-[3px] bg-paper px-3.5 py-3 shadow-hard ${
            problem || isTaken ? 'border-coral' : 'border-ink'
          }`}
        >
          <Text className="font-display text-xl text-clay">@</Text>
          <TextInput
            value={name}
            onChangeText={(t) => setName(t.replace(/\s/g, ''))}
            placeholder="tunombre"
            placeholderTextColor={colors.clay}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={16}
            className="ml-1 min-w-0 flex-1 font-display text-xl text-ink"
          />
        </View>

        <View className="mt-2 min-h-[18px]">
          {problem ? (
            <Text className="font-body-bold text-[11px] text-coral">{problem}</Text>
          ) : taken.isFetching ? (
            <Text className="font-body-semi text-[11px] text-clay">Viendo si está libre…</Text>
          ) : isTaken ? (
            <Text className="font-body-bold text-[11px] text-coral">Ese nombre ya está tomado</Text>
          ) : name.length >= 3 ? (
            <Text className="font-body-bold text-[11px] text-mint">¡Está libre!</Text>
          ) : null}
        </View>

        <View className="mt-4 flex-row items-start gap-2.5 rounded-[18px] border-[2.5px] border-ink bg-cream p-3.5">
          <Text className="text-base">📌</Text>
          <Text className="flex-1 font-body-semi text-[11.5px] leading-4 text-bark">
            El nombre queda guardado en la cadena y no se puede cambiar después. Elegí uno que te
            guste.
          </Text>
        </View>

        <View className="mt-5">
          <Button
            label="Reservar mi nombre"
            disabled={!canSubmit}
            loading={register.isPending}
            onPress={() => register.mutate(name, { onSuccess: () => router.back() })}
          />
        </View>

        {register.isError && (
          <Text className="mt-3 text-center font-body-bold text-[11px] text-coral">
            No se pudo registrar. Puede que alguien lo haya tomado recién.
          </Text>
        )}
      </ScrollView>
    </Screen>
  );
}
