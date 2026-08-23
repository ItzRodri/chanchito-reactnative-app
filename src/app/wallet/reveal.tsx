import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import * as ScreenCapture from 'expo-screen-capture';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { revealMnemonic } from '@/api/wallet';
import { BackButton, Button, HardPressable, Screen } from '@/components/ui';
import { requireDeviceAuth } from '@/lib/guard';
import { colors } from '@/theme/tokens';

type State =
  | { step: 'checking' }
  | { step: 'locked'; noProtection: boolean }
  | { step: 'revealed'; words: string[] };

/**
 * Ver la frase de recuperación después de haber creado la wallet.
 *
 * Existe porque la gente saltea el respaldo o pierde el papel, y sin esta
 * pantalla su plata quedaría atrapada en un solo teléfono para siempre.
 *
 * Ocultarla no protegería nada — la frase ya está en el dispositivo — así que
 * en vez de esconderla se la protege: autenticación del sistema para entrar,
 * capturas de pantalla bloqueadas mientras está visible, y oculta hasta que se
 * mantiene el dedo apretado.
 */
export default function RevealScreen() {
  const [state, setState] = useState<State>({ step: 'checking' });
  const [showing, setShowing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Nada de screenshots ni de grabación de pantalla mientras se está acá.
  useEffect(() => {
    ScreenCapture.preventScreenCaptureAsync('reveal-mnemonic').catch(() => {});
    return () => {
      ScreenCapture.allowScreenCaptureAsync('reveal-mnemonic').catch(() => {});
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const auth = await requireDeviceAuth('Confirmá tu identidad para ver la frase');
      if (cancelled) return;

      if (!auth.ok) {
        if (auth.reason === 'cancelled') {
          router.back();
          return;
        }
        // Sin PIN ni huella configurados no hay contra qué autenticar.
        setState({ step: 'locked', noProtection: true });
        return;
      }

      const phrase = await revealMnemonic();
      if (cancelled) return;
      setState({ step: 'revealed', words: phrase ? phrase.split(' ') : [] });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  async function unlockWithoutProtection() {
    const phrase = await revealMnemonic();
    setState({ step: 'revealed', words: phrase ? phrase.split(' ') : [] });
  }

  /** Lleva directo a la configuración de seguridad del sistema. */
  async function openSecuritySettings() {
    try {
      if (Platform.OS === 'android') {
        await Linking.sendIntent('android.settings.SECURITY_SETTINGS');
      } else {
        // iOS no deja abrir los ajustes de código: lo más cerca es la app.
        await Linking.openSettings();
      }
    } catch {
      // Si el sistema no expone esa pantalla, no pasa nada: sigue el aviso.
    }
  }

  if (state.step === 'checking') {
    return (
      <Screen>
        <ActivityIndicator className="mt-16" color={colors.ink} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerClassName="px-5 pb-8" showsVerticalScrollIndicator={false}>
        <BackButton onPress={() => router.back()} className="mb-1" />

        <Text className="font-display text-[22px] leading-7 text-ink">
          Tu frase de recuperación
        </Text>

        <View className="mt-4 flex-row items-start gap-2.5 rounded-[18px] border-[2.5px] border-ink bg-coral-tint p-3.5">
          <Text className="text-base">⚠️</Text>
          <Text className="flex-1 font-body-semi text-[11.5px] leading-4 text-bark">
            Quien tenga estas palabras puede sacar toda tu plata. Nadie de Chanchito te las va a
            pedir nunca. Las capturas de pantalla están bloqueadas en esta pantalla.
          </Text>
        </View>

        {state.step === 'locked' && (
          <View className="mt-4">
            <View className="rounded-[20px] border-[3px] border-ink bg-paper p-4 shadow-hard">
              <View className="mb-2.5 flex-row items-center gap-2.5">
                <View className="h-9 w-9 items-center justify-center rounded-xl border-2 border-ink bg-sun">
                  <Text className="text-base">🔓</Text>
                </View>
                <Text className="flex-1 font-display text-[15px] leading-5 text-ink">
                  Tu teléfono no tiene bloqueo
                </Text>
              </View>

              <Text className="font-body text-[12.5px] leading-[19px] text-bark">
                No tenés huella, PIN ni patrón configurados, así que no podemos comprobar que seas
                vos.
              </Text>

              {/*
                Lo importante no es esta pantalla: sin bloqueo de teléfono,
                cualquiera que lo agarre puede abrir Chanchito y mover la plata
                directamente. Decirlo es más útil que trabar el respaldo.
              */}
              <Text className="mt-2.5 font-body-semi text-[12.5px] leading-[19px] text-bark">
                Y hay algo más importante: sin bloqueo, cualquiera que agarre tu teléfono puede
                abrir Chanchito y mover tu plata sin que nadie le pregunte nada.
              </Text>

              <Text className="mt-2.5 font-body text-[12px] leading-[18px] text-cocoa">
                Configurá una huella o un PIN en los ajustes del sistema. Son dos minutos y
                protege todo, no sólo esta pantalla.
              </Text>

              <View className="mt-4">
                <Button label="Ir a los ajustes de seguridad" onPress={openSecuritySettings} />
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={unlockWithoutProtection}
              className="mt-4"
              style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}
            >
              <Text className="text-center font-body-bold text-xs text-coral underline">
                Mostrar la frase igual
              </Text>
            </Pressable>
            <Text className="mt-1.5 text-center font-body text-[10.5px] text-clay">
              Nadie queda afuera de su propia frase
            </Text>
          </View>
        )}

        {state.step === 'revealed' && (
          <>
            <Pressable
              onPressIn={() => setShowing(true)}
              onPressOut={() => setShowing(false)}
              accessibilityRole="button"
              accessibilityLabel="Mantené presionado para ver la frase"
              className="mt-4"
            >
              <View className="flex-row flex-wrap gap-2">
                {state.words.map((word, i) => (
                  <View
                    key={`${word}-${i}`}
                    className="w-[31%] flex-row items-center gap-1.5 rounded-[14px] border-[2.5px] border-ink bg-paper px-2.5 py-2.5"
                  >
                    <Text className="font-body-semi text-[10px] text-clay">{i + 1}</Text>
                    <Text className="font-display-bold text-[13px] text-ink">
                      {showing ? word : '••••••'}
                    </Text>
                  </View>
                ))}
              </View>

              {!showing && (
                <Text className="mt-3 text-center font-body-bold text-xs text-pink-deep">
                  Mantené presionado para ver
                </Text>
              )}
            </Pressable>

            <View className="mt-4">
              <HardPressable
                onPress={async () => {
                  await Clipboard.setStringAsync(state.words.join(' '));
                  setCopied(true);
                }}
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
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
